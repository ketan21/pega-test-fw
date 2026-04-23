import { Page, expect } from '@playwright/test';

/**
 * Base page class that all Pega page objects extend.
 * Provides common Pega-specific wait utilities and assertions.
 */
export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for Pega loading spinner to disappear
   */
  protected async waitForPegaLoading(timeout = 15000): Promise<void> {
    await this.page
      .locator('.pi-icon-loading, [class*="loading"]')
      .first()
      .waitFor({ state: 'detached', timeout });
  }

  /**
   * Wait for all Pega AJAX/XHR activities to complete
   */
  protected async waitForActivityComplete(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    // Small buffer for Pega's client-side rendering
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for and dismiss Pega modal dialogs
   */
  protected async handleModal(): Promise<void> {
    const modal = this.page.locator('[data-test-id="modal-dialog"], [class*="modal"]');
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      const okBtn = modal.locator('[data-test-id="btn-ok"], [class*="btn-primary"], button:has-text("OK"), button:has-text("Yes")');
      await okBtn.click();
      await this.waitForPegaLoading();
    }
  }

  /**
   * Assert that a Pega toast/notification appeared with expected message
   */
  protected async assertToast(
    message: string,
    expectedType: 'success' | 'error' | 'warning' | 'info' = 'success'
  ): Promise<void> {
    const toast = this.page.locator(
      `[data-test-id="toast"][class*="${expectedType}"]:has-text("${message}"), [class*="toast"][class*="${expectedType}"]:has-text("${message}")`
    );
    await expect(toast).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert that a Pega toast/notification disappeared
   */
  protected async assertToastDismissed(message: string): Promise<void> {
    const toast = this.page.locator(`[data-test-id="toast"]:has-text("${message}")`);
    await expect(toast).toBeHidden({ timeout: 10000 });
  }

  /**
   * Wait for Pega tab to become active
   */
  protected async waitForTabActive(tabName: string): Promise<void> {
    const tab = this.page.locator(`[data-test-id="tab-${tabName.toLowerCase().replace(/\s+/g, '-')}"]`);
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  }

  /**
   * Wait for Pega section to be visible
   */
  protected async waitForSectionVisible(sectionName: string): Promise<void> {
    const section = this.page.locator(`[data-test-id="section-${sectionName.toLowerCase().replace(/\s+/g, '-')}"]`);
    await expect(section).toBeVisible({ timeout: 10000 });
  }

  /**
   * Take a screenshot with timestamp
   */
  protected async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `./reports/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  /**
   * Wait for Pega dropdown to be ready
   */
  protected async waitForDropdownReady(): Promise<void> {
    // Wait for any dropdown overlay to appear and become stable
    await this.page.waitForSelector('[class*="dropdown"], [role="listbox"], [data-test-id*="dropdown"]', {
      state: 'visible',
      timeout: 5000,
    });
  }

  /**
   * Fill a Pega field by its data-test-id
   */
  protected async fillField(fieldId: string, value: string): Promise<void> {
    const locator = this.page.locator(`[data-test-id="field-${fieldId}"], [data-test-id="${fieldId}"]`);
    if (await locator.isVisible({ timeout: 5000 }).catch(() => false)) {
      await locator.fill(value);
    } else {
      // Fallback: try to find by label
      const labelLocator = this.page.getByLabel(fieldId);
      if (await labelLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
        await labelLocator.fill(value);
      } else {
        throw new Error(`Field "${fieldId}" not found`);
      }
    }
    await this.waitForActivityComplete();
  }

  /**
   * Select a value from a Pega dropdown by its data-test-id
   */
  protected async selectDropdownOption(dropdownId: string, value: string): Promise<void> {
    const locator = this.page.locator(`[data-test-id="dropdown-${dropdownId}"], [data-test-id="${dropdownId}"]`);
    await locator.click();
    await this.waitForDropdownReady();

    // Try to select by value
    const option = locator.locator(`option[value="${value}"], [data-test-id*="option-${value}"], [role="option"]:has-text("${value}")`);
    await option.click();
    await this.waitForActivityComplete();
  }

  /**
   * Click a Pega action button
   */
  protected async clickAction(actionId: string): Promise<void> {
    const locator = this.page.locator(`[data-test-id="btn-${actionId}"], [data-test-id="action-${actionId}"]`);
    await locator.click();
    await this.waitForPegaLoading();
  }
}
