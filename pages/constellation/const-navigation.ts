import { Page } from '@playwright/test';
import { BasePage } from '../base/base-page';

/**
 * Constellation navigation page object
 */
export class ConstellationNavigation extends BasePage {
  readonly mainMenu = this.page.locator('[data-test-id="main-menu"], [class*="main-menu"]');
  readonly workbasketLink = this.page.locator('[data-test-id="nav-workbasket"], [data-test-id*="workbasket"]');
  readonly caseTypeLink = this.page.locator('[data-test-id="nav-case-types"]');
  readonly dashboardLink = this.page.locator('[data-test-id="nav-dashboard"]');
  readonly searchField = this.page.locator('[data-test-id="global-search"], [data-test-id*="search"]');
  readonly userMenu = this.page.locator('[data-test-id="user-menu"]');
  readonly logoutButton = this.page.locator('[data-test-id="btn-logout"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to workbasket
   */
  async goToWorkbasket(): Promise<void> {
    await this.workbasketLink.click();
    await this.waitForPegaLoading();
  }

  /**
   * Navigate to dashboard
   */
  async goToDashboard(): Promise<void> {
    await this.dashboardLink.click();
    await this.waitForPegaLoading();
  }

  /**
   * Navigate to case types
   */
  async goToCaseTypes(): Promise<void> {
    await this.caseTypeLink.click();
    await this.waitForPegaLoading();
  }

  /**
   * Search for a case
   */
  async searchCase(searchTerm: string): Promise<void> {
    await this.searchField.fill(searchTerm);
    await this.page.keyboard.press('Enter');
    await this.waitForPegaLoading();
  }

  /**
   * Open user menu
   */
  async openUserMenu(): Promise<void> {
    await this.userMenu.click();
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.logoutButton.click();
    await this.waitForPegaLoading();
  }

  /**
   * Verify navigation to workbasket
   */
  async expectOnWorkbasket(): Promise<void> {
    await this.page.waitForSelector('[data-test-id="workbasket-list"]', { timeout: 10000 });
  }
}
