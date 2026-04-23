import { Page, expect } from '@playwright/test';
import { BasePage } from '../base/base-page';

/**
 * Constellation case flow page object
 */
export class ConstellationCaseFlow extends BasePage {
  readonly newCaseButton = this.page.getByRole('button', { name: 'New Case' }).or(
    this.page.locator('[data-test-id="btn-new-case"]')
  );
  readonly caseTypeSelector = this.page.locator('[data-test-id="case-type-selector"]');
  readonly caseSubmitButton = this.page.locator('[data-test-id="btn-submit"]');
  readonly caseCancelButton = this.page.locator('[data-test-id="btn-cancel"]');
  readonly caseSaveButton = this.page.locator('[data-test-id="btn-save"]');
  readonly caseNextButton = this.page.locator('[data-test-id="btn-next"]');
  readonly casePrevButton = this.page.locator('[data-test-id="btn-prev"]');
  readonly caseSummary = this.page.locator('[data-test-id="case-summary"]');
  readonly caseStatus = this.page.locator('[data-test-id="case-status"]');
  readonly caseIdDisplay = this.page.locator('[data-test-id="case-id"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Start creating a new case
   */
  async startNewCase(caseType: string): Promise<void> {
    await this.newCaseButton.click();
    await this.waitForPegaLoading();
    if (caseType) {
      await this.selectCaseType(caseType);
    }
  }

  /**
   * Select a case type from the dropdown
   */
  async selectCaseType(caseType: string): Promise<void> {
    await this.caseTypeSelector.click();
    await this.waitForDropdownReady();

    // Try multiple locator strategies for the option
    const option = this.page.locator(
      `[data-test-id*="option-${caseType.toLowerCase()}"], [role="option"]:has-text("${caseType}"), option[value="${caseType}"]`
    );
    await option.click();
    await this.waitForActivityComplete();
  }

  /**
   * Fill case fields
   */
  async fillCaseFields(fields: Record<string, string>): Promise<void> {
    for (const [fieldId, value] of Object.entries(fields)) {
      await this.fillField(fieldId, value);
    }
  }

  /**
   * Submit the case
   */
  async submitCase(): Promise<void> {
    await this.caseSubmitButton.click();
    await this.waitForPegaLoading();
  }

  /**
   * Save the case (partial save)
   */
  async saveCase(): Promise<void> {
    await this.caseSaveButton.click();
    await this.waitForPegaLoading();
  }

  /**
   * Cancel the case creation
   */
  async cancelCase(): Promise<void> {
    await this.caseCancelButton.click();
    await this.handleModal();
  }

  /**
   * Navigate to next step in the case flow
   */
  async goToNextStep(): Promise<void> {
    await this.caseNextButton.click();
    await this.waitForActivityComplete();
  }

  /**
   * Navigate to previous step in the case flow
   */
  async goToPreviousStep(): Promise<void> {
    await this.casePrevButton.click();
    await this.waitForActivityComplete();
  }

  /**
   * Get the current case ID
   */
  async getCaseId(): Promise<string> {
    return this.caseIdDisplay.textContent() || '';
  }

  /**
   * Get the current case status
   */
  async getCaseStatus(): Promise<string> {
    return this.caseStatus.textContent() || '';
  }

  /**
   * Complete case creation flow
   */
  async createCase(caseType: string, fields: Record<string, string>): Promise<string> {
    await this.startNewCase(caseType);
    await this.fillCaseFields(fields);
    await this.submitCase();

    const caseId = await this.getCaseId();
    await this.waitForSectionVisible('case-summary');

    return caseId;
  }
}
