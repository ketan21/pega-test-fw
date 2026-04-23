import { Page } from '@playwright/test';
import { BasePage } from '../base/base-page';

/**
 * Pega login page - common to both Constellation and Traditional UI
 */
export class LoginPage extends BasePage {
  readonly usernameField = this.page.locator('[data-test-id="txt-username"], input[name="userID"], input[type="text"]');
  readonly passwordField = this.page.locator('[data-test-id="txt-password"], input[name="password"], input[type="password"]');
  readonly submitButton = this.page.locator('[data-test-id="btn-signin"], button[type="submit"]');
  readonly errorMessage = this.page.locator('[data-test-id="login-error"], [class*="login-error"]');
  readonly rememberMeCheckbox = this.page.locator('[data-test-id="chk-remember-me"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to Pega login page
   */
  async goto(baseUrl: string): Promise<void> {
    await this.page.goto(`${baseUrl}/prweb`);
  }

  /**
   * Enter login credentials
   */
  async enterCredentials(username: string, password: string): Promise<void> {
    await this.usernameField.fill(username);
    await this.passwordField.fill(password);
  }

  /**
   * Submit the login form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
    await this.waitForPegaLoading();
  }

  /**
   * Complete login flow
   */
  async login(username: string, password: string): Promise<void> {
    await this.enterCredentials(username, password);
    await this.submit();
  }

  /**
   * Check if login was successful (navigate to home or dashboard)
   */
  async expectLoggedIn(): Promise<void> {
    // Wait for either workbasket or dashboard to appear
    await this.page.waitForSelector(
      '[data-test-id="workbasket-list"], [data-test-id="case-list"], [class*="dashboard"]',
      { timeout: 30000 }
    );
  }

  /**
   * Check for login error message
   */
  async expectLoginError(expectedMessage: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: 10000 });
    await expect(this.errorMessage).toContainText(expectedMessage);
  }
}
