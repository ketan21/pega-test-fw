/**
 * E2E tests for Constellation UI - Workbasket Operations
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/shared/login-page';
import { ConstellationNavigation } from '../../pages/constellation/const-navigation';
import { ConstellationWorkbasket } from '../../pages/constellation/const-workbasket';

test.describe('@e2e @ui @constellation Workbasket Operations', () => {
  test('should navigate to workbasket and view assignments', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const navigation = new ConstellationNavigation(page);
    const workbasket = new ConstellationWorkbasket(page);

    const env = process.env.PEGA_ENV || 'dev';
    const configPath = `./config/environments/${env}.json`;
    const config = await import(configPath).then(m => m.default || JSON.parse(await import('fs').promises.readFile(configPath, 'utf-8')));

    await page.goto(`${config.baseUrl}/prweb`);
    await loginPage.login(config.testUsers[0].username, config.testUsers[0].password);
    await loginPage.expectLoggedIn();

    await navigation.goToWorkbasket();

    // Verify workbasket is visible
    await expect(workbasket.workbasketList).toBeVisible({ timeout: 10000 });
  });

  test('should search for assignments in workbasket', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const navigation = new ConstellationNavigation(page);
    const workbasket = new ConstellationWorkbasket(page);

    const env = process.env.PEGA_ENV || 'dev';
    const configPath = `./config/environments/${env}.json`;
    const config = await import(configPath).then(m => m.default || JSON.parse(await import('fs').promises.readFile(configPath, 'utf-8')));

    await page.goto(`${config.baseUrl}/prweb`);
    await loginPage.login(config.testUsers[0].username, config.testUsers[0].password);
    await loginPage.expectLoggedIn();

    await navigation.goToWorkbasket();

    // Search for something (use a non-matching term to verify no results)
    await workbasket.searchAssignment('NONEXISTENT-CASE-12345');
    await workbasket.waitForPegaLoading();

    // Should show no results
    const count = await workbasket.getAssignmentCount();
    expect(count).toBe(0);
  });

  test('should filter assignments by status', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const navigation = new ConstellationNavigation(page);
    const workbasket = new ConstellationWorkbasket(page);

    const env = process.env.PEGA_ENV || 'dev';
    const configPath = `./config/environments/${env}.json`;
    const config = await import(configPath).then(m => m.default || JSON.parse(await import('fs').promises.readFile(configPath, 'utf-8')));

    await page.goto(`${config.baseUrl}/prweb`);
    await loginPage.login(config.testUsers[0].username, config.testUsers[0].password);
    await loginPage.expectLoggedIn();

    await navigation.goToWorkbasket();

    // Filter by Open status
    await workbasket.filterByStatus('Open');

    // Verify filter is applied (check that workbasket is still visible)
    await expect(workbasket.workbasketList).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const navigation = new ConstellationNavigation(page);

    const env = process.env.PEGA_ENV || 'dev';
    const configPath = `./config/environments/${env}.json`;
    const config = await import(configPath).then(m => m.default || JSON.parse(await import('fs').promises.readFile(configPath, 'utf-8')));

    await page.goto(`${config.baseUrl}/prweb`);
    await loginPage.login(config.testUsers[0].username, config.testUsers[0].password);
    await loginPage.expectLoggedIn();

    await navigation.goToDashboard();

    // Verify dashboard is loaded
    await expect(page.locator('[class*="dashboard"]')).toBeVisible({ timeout: 10000 });
  });

  test('should logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const navigation = new ConstellationNavigation(page);

    const env = process.env.PEGA_ENV || 'dev';
    const configPath = `./config/environments/${env}.json`;
    const config = await import(configPath).then(m => m.default || JSON.parse(await import('fs').promises.readFile(configPath, 'utf-8')));

    await page.goto(`${config.baseUrl}/prweb`);
    await loginPage.login(config.testUsers[0].username, config.testUsers[0].password);
    await loginPage.expectLoggedIn();

    await navigation.logout();

    // Verify redirected to login page
    await expect(page.locator('[data-test-id="txt-username"]')).toBeVisible({ timeout: 10000 });
  });
});
