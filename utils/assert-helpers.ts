/**
 * Custom assertion helpers for Pega testing
 */
import { expect, Page } from '@playwright/test';

/**
 * Assert that a Pega case status matches expected value
 */
export async function expectCaseStatus(
  page: Page,
  caseId: string,
  expectedStatus: string
): Promise<void> {
  const statusLocator = page.locator(`[data-test-id="case-status-${caseId}"], [data-test-id="case-status"]`);
  await expect(statusLocator).toContainText(expectedStatus, { timeout: 10000 });
}

/**
 * Assert that a Pega field contains expected value
 */
export async function expectFieldValue(
  page: Page,
  fieldId: string,
  expectedValue: string
): Promise<void> {
  const field = page.locator(`[data-test-id="field-${fieldId}"], [data-test-id="${fieldId}"]`);
  await expect(field).toHaveValue(expectedValue, { timeout: 10000 });
}

/**
 * Assert that a Pega assignment appears in workbasket
 */
export async function expectAssignmentInWorkbasket(
  page: Page,
  assignmentId: string
): Promise<void> {
  const assignment = page.locator(`[data-test-id="assignment-item"]:has-text("${assignmentId}")`);
  await expect(assignment).toBeVisible({ timeout: 10000 });
}

/**
 * Assert that a Pega toast notification has expected type
 */
export async function expectToastType(
  page: Page,
  expectedType: 'success' | 'error' | 'warning' | 'info'
): Promise<void> {
  const toast = page.locator(`[class*="toast"][class*="${expectedType}"]`);
  await expect(toast).toBeVisible({ timeout: 10000 });
}

/**
 * Assert that a Pega loading spinner is NOT visible
 */
export async function expectNotLoading(page: Page): Promise<void> {
  const spinner = page.locator('.pi-icon-loading, [class*="loading"]');
  await expect(spinner).toHaveCount(0, { timeout: 5000 });
}

/**
 * Assert that a Pega tab is active
 */
export async function expectTabActive(page: Page, tabName: string): Promise<void> {
  const tab = page.locator(`[data-test-id="tab-${tabName.toLowerCase().replace(/\s+/g, '-')}"]`);
  await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 10000 });
}

/**
 * Assert that a Pega section is visible
 */
export async function expectSectionVisible(page: Page, sectionName: string): Promise<void> {
  const section = page.locator(`[data-test-id="section-${sectionName.toLowerCase().replace(/\s+/g, '-')}"]`);
  await expect(section).toBeVisible({ timeout: 10000 });
}

/**
 * Assert that a Pega button is enabled
 */
export async function expectButtonEnabled(page: Page, buttonId: string): Promise<void> {
  const btn = page.locator(`[data-test-id="btn-${buttonId}"], [data-test-id="action-${buttonId}"]`);
  await expect(btn).toBeEnabled({ timeout: 5000 });
}

/**
 * Assert that a Pega button is disabled
 */
export async function expectButtonDisabled(page: Page, buttonId: string): Promise<void> {
  const btn = page.locator(`[data-test-id="btn-${buttonId}"], [data-test-id="action-${buttonId}"]`);
  await expect(btn).toBeDisabled({ timeout: 5000 });
}

/**
 * Assert that a Pega dropdown has expected options
 */
export async function expectDropdownOptions(
  page: Page,
  dropdownId: string,
  expectedOptions: string[]
): Promise<void> {
  const dropdown = page.locator(`[data-test-id="dropdown-${dropdownId}"]`);
  await dropdown.click();

  // Wait for dropdown menu to open
  await page.waitForSelector('[role="listbox"], [class*="dropdown-menu"]', { timeout: 5000 });

  const options = page.locator('[role="option"]');
  const optionTexts = await options.allTextContents();

  for (const expected of expectedOptions) {
    expect(optionTexts).toContain(expected);
  }

  // Close dropdown
  await page.keyboard.press('Escape');
}
