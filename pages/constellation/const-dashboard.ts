import { Page } from '@playwright/test';
import { BasePage } from '../base/base-page';

/**
 * Constellation dashboard page object
 */
export class ConstellationDashboard extends BasePage {
  readonly dashboardWidget = this.page.locator('[data-test-id*="widget-"], [class*="dashboard-widget"]');
  readonly caseCountWidget = this.page.locator('[data-test-id*="widget-case-count"]');
  readonly pendingCasesWidget = this.page.locator('[data-test-id*="widget-pending"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Verify dashboard is loaded
   */
  async expectDashboardLoaded(): Promise<void> {
    await this.page.waitForSelector('[class*="dashboard"], [data-test-id*="dashboard"]', {
      timeout: 10000,
    });
  }

  /**
   * Get the count of cases from dashboard widget
   */
  async getCaseCount(): Promise<string> {
    return this.caseCountWidget.textContent() || '0';
  }

  /**
   * Get the count of pending cases
   */
  async getPendingCasesCount(): Promise<string> {
    return this.pendingCasesWidget.textContent() || '0';
  }
}
