/**
 * Wait helpers for Pega-specific timing patterns
 */
import { Page, Locator } from '@playwright/test';

/**
 * Wait for a Pega element to be stable (visible + not animating)
 */
export async function waitForPegaElementStable(
  page: Page,
  locator: Locator | string,
  timeout = 10000
): Promise<void> {
  const loc = typeof locator === 'string' ? page.locator(locator) : locator;
  await loc.waitFor({ state: 'visible', timeout });
  // Wait for any CSS transitions/animations to complete
  await page.waitForFunction(
    () => {
      const elements = document.querySelectorAll('*');
      for (const el of Array.from(elements)) {
        const style = window.getComputedStyle(el);
        if (
          style.transitionDuration &&
          style.transitionDuration !== '0s' &&
          style.animationDuration &&
          style.animationDuration !== '0s'
        ) {
          return false;
        }
      }
      return true;
    },
    { timeout: 2000 }
  ).catch(() => {}); // Ignore if no animated elements found
}

/**
 * Wait for Pega loading indicator to disappear
 */
export async function waitForPegaLoading(page: Page, timeout = 15000): Promise<void> {
  await page.waitForSelector('.pi-icon-loading, [class*="loading"]', {
    state: 'detached',
    timeout
  }).catch(() => {
    // Loading indicator may not always be present
  });
}

/**
 * Wait for Pega activity (AJAX) to complete
 */
export async function waitForActivityComplete(page: Page, timeout = 15000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  // Small buffer for client-side rendering
  await page.waitForTimeout(500);
}

/**
 * Wait for a toast notification to appear
 */
export async function waitForToast(page: Page, message: string, timeout = 10000): Promise<void> {
  await page.waitForSelector(
    `[data-test-id="toast"]:has-text("${message}"), [class*="toast"]:has-text("${message}")`,
    { timeout }
  );
}

/**
 * Wait for a toast notification to disappear
 */
export async function waitForToastDismissed(page: Page, message: string, timeout = 10000): Promise<void> {
  await page.waitForSelector(
    `[data-test-id="toast"]:has-text("${message}")`,
    { state: 'hidden', timeout }
  );
}

/**
 * Wait for a Pega modal dialog to appear and optionally click a button
 */
export async function waitForModal(
  page: Page,
  buttonText?: string,
  timeout = 5000
): Promise<void> {
  const modal = page.locator('[data-test-id="modal-dialog"], [class*="modal"]');
  await modal.waitFor({ state: 'visible', timeout });

  if (buttonText) {
    const btn = modal.locator(`button:has-text("${buttonText}")`);
    await btn.click();
    await waitForPegaLoading(page);
  }
}

/**
 * Wait for a Pega dropdown to open and be ready
 */
export async function waitForDropdown(page: Page, timeout = 5000): Promise<void> {
  await page.waitForSelector(
    '[class*="dropdown"], [role="listbox"], [data-test-id*="dropdown"]',
    { state: 'visible', timeout }
  );
}

/**
 * Smart wait: waits for either Pega loading to finish OR a specific element to appear
 */
export async function smartWait(
  page: Page,
  element: Locator | string,
  maxTimeout = 15000
): Promise<void> {
  const loc = typeof element === 'string' ? page.locator(element) : element;

  // Race between loading disappearing and element appearing
  await Promise.race([
    waitForPegaLoading(page, maxTimeout),
    loc.waitFor({ state: 'visible', timeout: maxTimeout }),
  ]);

  // Ensure any remaining loading is gone
  await waitForPegaLoading(page, 3000).catch(() => {});
}

/**
 * Wait for Pega tab to become visible and active
 */
export async function waitForTabActive(page: Page, tabName: string, timeout = 10000): Promise<void> {
  const tab = page.locator(`[data-test-id="tab-${tabName.toLowerCase().replace(/\s+/g, '-')}"]`);
  await tab.waitFor({ state: 'visible', timeout });
  await tab.evaluate((el) => el.getAttribute('aria-selected') === 'true');
}

/**
 * Wait for a Pega section to be visible
 */
export async function waitForSectionVisible(page: Page, sectionName: string, timeout = 10000): Promise<void> {
  const section = page.locator(`[data-test-id="section-${sectionName.toLowerCase().replace(/\s+/g, '-')}"]`);
  await section.waitFor({ state: 'visible', timeout });
}
