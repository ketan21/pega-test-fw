/**
 * Smoke test suite - quick sanity checks for CI
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/shared/login-page';
import { ConstellationNavigation } from '../pages/constellation/const-navigation';

test.describe('@smoke @e2e Smoke Suite', () => {
  test('smoke: login and navigate to workbasket', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const navigation = new ConstellationNavigation(page);

    const env = process.env.PEGA_ENV || 'dev';
    const fs = await import('fs');
    const path = await import('path');
    const configPath = path.default.join(__dirname, `../config/environments/${env}.json`);
    let config: any;
    try {
      config = JSON.parse(fs.default.readFileSync(configPath, 'utf-8'));
    } catch {
      config = {
        baseUrl: process.env.PEGA_BASE_URL || 'http://localhost:8080',
        testUsers: [{
          username: process.env.PEGA_USERNAME || 'PEGA-User1',
          password: process.env.PEGA_PASSWORD || 'password',
        }],
      };
    }

    const resolveEnvVars = (obj: any): any => {
      if (typeof obj === 'string' && obj.startsWith('${') && obj.endsWith('}')) {
        return process.env[obj.slice(2, -1)] || obj;
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

    await page.goto(`${config.baseUrl}/prweb`);
    await loginPage.login(config.testUsers[0].username, config.testUsers[0].password);
    await loginPage.expectLoggedIn();

    await navigation.goToWorkbasket();
    await navigation.expectOnWorkbasket();
  });

  test('smoke: API health check', async () => {
    const env = process.env.PEGA_ENV || 'dev';
    const fs = await import('fs');
    const path = await import('path');
    const configPath = path.default.join(__dirname, `../config/environments/${env}.json`);
    let config: any;
    try {
      config = JSON.parse(fs.default.readFileSync(configPath, 'utf-8'));
    } catch {
      config = {
        baseUrl: process.env.PEGA_BASE_URL || 'http://localhost:8080',
      };
    }

    const response = await fetch(`${config.baseUrl}/prweb/api/v1/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.ok).toBe(true);
  });
});
