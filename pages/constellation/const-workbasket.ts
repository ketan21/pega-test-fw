import { Page } from '@playwright/test';
import { BasePage } from '../base/base-page';

/**
 * Constellation workbasket page object
 */
export class ConstellationWorkbasket extends BasePage {
  readonly workbasketList = this.page.locator('[data-test-id="workbasket-list"]');
  readonly workbasketSearch = this.page.locator('[data-test-id="workbasket-search"]');
  readonly assignmentRow = this.page.locator('[data-test-id="assignment-item"]');
  readonly takeAssignmentBtn = this.page.locator('[data-test-id="btn-take"]');
  readonly dropAssignmentBtn = this.page.locator('[data-test-id="btn-drop"]');
  readonly clearAssignmentBtn = this.page.locator('[data-test-id="btn-clear"]');
  readonly filterField = this.page.locator('[data-test-id="filter-by-status"]');
  readonly refreshButton = this.page.locator('[data-test-id="btn-refresh"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Search for an assignment
   */
  async searchAssignment(searchTerm: string): Promise<void> {
    await this.workbasketSearch.fill(searchTerm);
    await this.page.keyboard.press('Enter');
    await this.waitForPegaLoading();
  }

  /**
   * Filter assignments by status
   */
  async filterByStatus(status: string): Promise<void> {
    await this.filterField.click();
    await this.waitForDropdownReady();
    const option = this.page.locator(`[role="option"]:has-text("${status}")`);
    await option.click();
    await this.waitForActivityComplete();
  }

  /**
   * Click on an assignment to open it
   */
  async openAssignment(index: number = 0): Promise<void> {
    const rows = this.page.locator('[data-test-id="assignment-item"]');
    await rows.nth(index).click();
    await this.waitForPegaLoading();
  }

  /**
   * Take the first available assignment
   */
  async takeFirstAssignment(): Promise<void> {
    await this.takeAssignmentBtn.first().click();
    await this.waitForPegaLoading();
  }

  /**
   * Drop an assignment
   */
  async dropAssignment(): Promise<void> {
    await this.dropAssignmentBtn.click();
    await this.waitForPegaLoading();
  }

  /**
   * Clear an assignment
   */
  async clearAssignment(): Promise<void> {
    await this.clearAssignmentBtn.click();
    await this.waitForPegaLoading();
  }

  /**
   * Refresh the workbasket
   */
  async refresh(): Promise<void> {
    await this.refreshButton.click();
    await this.waitForPegaLoading();
  }

  /**
   * Get the count of assignments in the workbasket
   */
  async getAssignmentCount(): Promise<number> {
    return this.assignmentRow.count();
  }

  /**
   * Get details of an assignment by index
   */
  async getAssignmentDetails(index: number): Promise<{ caseId: string; caseType: string; status: string }> {
    const row = this.assignmentRow.nth(index);
    return {
      caseId: await row.locator('[data-test-id="assignment-case-id"]').textContent() || '',
      caseType: await row.locator('[data-test-id="assignment-case-type"]').textContent() || '',
      status: await row.locator('[data-test-id="assignment-status"]').textContent() || '',
    };
  }
}
