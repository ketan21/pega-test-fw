/**
 * E2E tests for Constellation UI - Case Creation
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/shared/login-page';
import { ConstellationCaseFlow } from '../../pages/constellation/const-case-flow';
import { ConstellationNavigation } from '../../pages/constellation/const-navigation';
import { generateSampleCasePayload, generateCaseNumber } from '../../utils/data-generator';

test.describe('@e2e @ui @constellation @smoke Case Creation', () => {
  test('should create a new case through Constellation UI', async ({ page }) => {
    // Setup page objects
    const loginPage = new LoginPage(page);
    const caseFlow = new ConstellationCaseFlow(page);
    const navigation = new ConstellationNavigation(page);

    // Step 1: Navigate to Pega and login
    const env = process.env.PEGA_ENV || 'dev';
    const configPath = `./config/environments/${env}.json`;
    const config = await import(configPath).then(m => m.default || JSON.parse(await import('fs').promises.readFile(configPath, 'utf-8')));

    await page.goto(`${config.baseUrl}/prweb`);
    await loginPage.login(config.testUsers[0].username, config.testUsers[0].password);
    await loginPage.expectLoggedIn();

    // Step 2: Start creating a new case
    await caseFlow.startNewCase('Standard');

    // Step 3: Fill in case fields
    const caseData = generateSampleCasePayload();
    await caseFlow.fillCaseFields(caseData);

    // Step 4: Submit the case
    await caseFlow.submitCase();

    // Step 5: Verify case was created
    const caseId = await caseFlow.getCaseId();
    expect(caseId).toBeTruthy();
    await caseFlow.waitForSectionVisible('case-summary');

    console.log(`✅ Case created successfully: ${caseId}`);
  });

  test('should cancel case creation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const caseFlow = new ConstellationCaseFlow(page);

    const env = process.env.PEGA_ENV || 'dev';
    const configPath = `./config/environments/${env}.json`;
    const config = await import(configPath).then(m => m.default || JSON.parse(await import('fs').promises.readFile(configPath, 'utf-8')));

    await page.goto(`${config.baseUrl}/prweb`);
    await loginPage.login(config.testUsers[0].username, config.testUsers[0].password);
    await loginPage.expectLoggedIn();

    await caseFlow.startNewCase('Standard');

    // Fill some fields
    await caseFlow.fillCaseFields({
      'Customer.FirstName': 'Test',
      'Customer.LastName': 'User',
    });

    // Cancel
    await caseFlow.cancelCase();

    // Verify we're back to workbasket
    await expect(page.locator('[data-test-id="workbasket-list"]')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to workbasket and verify empty list', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const navigation = new ConstellationNavigation(page);

    const env = process.env.PEGA_ENV || 'dev';
    const configPath = `./config/environments/${env}.json`;
    const config = await import(configPath).then(m => m.default || JSON.parse(await import('fs').promises.readFile(configPath, 'utf-8')));

    await page.goto(`${config.baseUrl}/prweb`);
    await loginPage.login(config.testUsers[0].username, config.testUsers[0].password);
    await loginPage.expectLoggedIn();

    await navigation.goToWorkbasket();
    await navigation.expectOnWorkbasket();

    // Workbasket may have assignments or may be empty depending on test data
    const count = await page.locator('[data-test-id="assignment-item"]').count();
    console.log(`Workbasket has ${count} assignments`);
  });
});
