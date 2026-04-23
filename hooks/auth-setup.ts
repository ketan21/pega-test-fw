/**
 * Global setup: authenticate with Pega and prepare test data
 * This runs once before all tests
 */
import { chromium, Browser, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export default async function globalSetup() {
  const env = process.env.PEGA_ENV || 'dev';
  const configPath = path.join(__dirname, '../config/environments', `${env}.json`);

  let config: any;
  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configContent);
  } catch (error) {
    console.warn(`Could not load config from ${configPath}, using defaults`);
    config = {
      baseUrl: process.env.PEGA_BASE_URL || 'http://localhost:8080',
      appName: process.env.PEGA_APP_NAME || 'MyPegaApp',
      testUsers: [{
        username: process.env.PEGA_USERNAME || 'PEGA-User1',
        password: process.env.PEGA_PASSWORD || 'password',
      }],
    };
  }

  // Resolve environment variable placeholders in config
  const resolveEnvVars = (obj: any): any => {
    if (typeof obj === 'string' && obj.startsWith('${') && obj.endsWith('}')) {
      const envVar = obj.slice(2, -1);
      return process.env[envVar] || obj;
    }
    if (Array.isArray(obj)) return obj.map(resolveEnvVars);
    if (typeof obj === 'object' && obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, resolveEnvVars(v)])
      );
    }
    return obj;
  };

  config = resolveEnvVars(config);

  // Launch browser and create authenticated context
  const browser: Browser = await chromium.launch({
    headless: config.browser?.headless ?? true,
  });

  const context: BrowserContext = await browser.newContext({
    storageState: './reports/auth-state.json',
    viewport: config.browser?.viewport || { width: 1920, height: 1080 },
    locale: config.browser?.locales || 'en-US',
    timezoneId: config.browser?.timezone || 'America/New_York',
  });

  const page = await context.newPage();

  try {
    // Navigate to Pega login
    await page.goto(`${config.baseUrl}/prweb`);

    // Fill login credentials
    const usernameField = page.locator('[data-test-id="txt-username"], input[name="userID"], input[type="text"]');
    const passwordField = page.locator('[data-test-id="txt-password"], input[name="password"], input[type="password"]');
    const submitBtn = page.locator('[data-test-id="btn-signin"], button[type="submit"]');

    await usernameField.fill(config.testUsers[0].username);
    await passwordField.fill(config.testUsers[0].password);
    await submitBtn.click();

    // Wait for navigation to home
    await page.waitForURL('**/prweb/**', { timeout: 30000 });

    // Save auth state
    await context.storageState({ path: './reports/auth-state.json' });

    console.log(`✅ Global setup complete: authenticated as ${config.testUsers[0].username}`);
  } catch (error) {
    console.warn('⚠️ Global setup failed (continuing without auth state):', error);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}
