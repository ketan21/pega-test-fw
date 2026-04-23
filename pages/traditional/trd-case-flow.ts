import { Page } from '@playwright/test';
import { BasePage } from '../base/base-page';

/**
 * Traditional UI case flow page object
 */
export class TraditionalCaseFlow extends BasePage {
  private readonly workspaceFrame = this.page.frameLocator('iframe[name="workpane"]');

  readonly caseTypeSelector = this.workspaceFrame.locator('[data-test-id="case-type-selector"]');
  readonly caseSubmitButton = this.workspaceFrame.locator('[data-test-id="btn-submit"]');
  readonly caseCancelButton = this.workspaceFrame.locator('[data-test-id="btn-cancel"]');
  readonly caseSaveButton = this.workspaceFrame.locator('[data-test-id="btn-save"]');
  readonly caseFields = this.workspaceFrame.locator('[data-test-id^="field-"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Select a case type in Traditional UI
   */
  async selectCaseType(caseType: string): Promise<void> {
    await this.caseTypeSelector.click();
    await this.waitForDropdownReady();
    const option = this.workspaceFrame.locator(`option[value="${caseType}"]`);
    await option.click();
    await this.waitForActivityComplete();
  }

  /**
   * Fill case fields in Traditional UI
   */
  async fillCaseFields(fields: Record<string, string>): Promise<void> {
    for (const [fieldId, value] of Object.entries(fields)) {
      const locator = this.workspaceFrame.locator(`[data-test-id="field-${fieldId}"]`);
      await locator.fill(value);
    }
    await this.waitForActivityComplete();
  }

  /**
   * Submit a case in Traditional UI
   */
  async submitCase(): Promise<void> {
    await this.caseSubmitButton.click();
    await this.waitForPegaLoading();
  }

  /**
   * Save a case in Traditional UI
   */
  async saveCase(): Promise<void> {
    await this.caseSaveButton.click();
    await this.waitForPegaLoading();
  }

  /**
   * Cancel case creation in Traditional UI
   */
  async cancelCase(): Promise<void> {
    await this.caseCancelButton.click();
    await this.handleModal();
  }
}
