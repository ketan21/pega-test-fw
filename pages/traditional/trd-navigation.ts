import { Page } from '@playwright/test';
import { BasePage } from '../base/base-page';

/**
 * Traditional UI navigation page object
 * Traditional UI uses iframes for the workspace
 */
export class TraditionalNavigation extends BasePage {
  private readonly workspaceFrame = this.page.frameLocator('iframe[name="workpane"]');
  private readonly clipboardFrame = this.page.frameLocator('iframe[name="clipboard"]');

  readonly mainMenu = this.page.locator('[class*="main-menu"], [class*="toolbar"]');
  readonly workbasketLink = this.page.locator('[class*="nav-item"]:has-text("Workbasket")');
  readonly searchField = this.page.locator('[class*="search-box"]');
  readonly userMenu = this.page.locator('[class*="user-menu"]');
  readonly logoutButton = this.page.locator('[class*="logout"]');

  // Workspace frame elements
  readonly wsNewCaseButton = this.workspaceFrame.locator('[data-test-id="btn-new-case"]');
  readonly wsCaseList = this.workspaceFrame.locator('[data-test-id="case-list"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to workbasket in Traditional UI
   */
  async goToWorkbasket(): Promise<void> {
    await this.workbasketLink.click();
    await this.waitForPegaLoading();
  }

  /**
   * Search for a case in Traditional UI
   */
  async searchCase(searchTerm: string): Promise<void> {
    await this.searchField.fill(searchTerm);
    await this.page.keyboard.press('Enter');
    await this.waitForPegaLoading();
  }

  /**
   * Click new case in Traditional UI
   */
  async startNewCase(): Promise<void> {
    await this.wsNewCaseButton.click();
    await this.waitForPegaLoading();
  }

  /**
   * Get the workspace frame for interactions
   */
  getWorkspaceFrame() {
    return this.workspaceFrame;
  }

  /**
   * Logout from Traditional UI
   */
  async logout(): Promise<void> {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.waitForPegaLoading();
  }
}
