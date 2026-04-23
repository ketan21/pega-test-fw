import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Look for test files in the "tests" directory
  testDir: './tests',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 3 : undefined,

  // Reporter to use
  reporter: process.env.CI
    ? [['github'], ['json', { outputFile: './reports/playwright/results.json' }]]
    : [
        ['html', {
          open: 'never',
          outputFolder: './reports/playwright/html',
          dashboard: true,
        }],
        ['list'],
      ],

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: process.env.PEGA_BASE_URL || 'http://localhost:8080',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Action timeout
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 30000,

    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',

    // Storage state for auth (persisted between tests)
    storageState: './reports/auth-state.json',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    // Test against mobile viewports
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],

  // Global setup: authenticate and prepare test data
  globalSetup: './hooks/auth-setup.ts',

  // Global teardown: clean up test data
  globalTeardown: './hooks/data-cleanup.ts',

  // Per-test-timeout
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },
});
