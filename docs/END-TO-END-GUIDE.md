# Pega Test Framework — End-to-End Guide

> How the framework works, how a test executes, and how to write new tests.

---

## 1. Architecture Overview

```
pega-test-framework/
│
├── playwright.config.ts          ← Single source of truth: browsers, timeouts, reporters, auth
├── tsconfig.json                 ← TypeScript compiler options
├── package.json                  ← Dependencies & scripts
│
├── config/                       ← Environment & test data configuration
│   ├── environments/
│   │   ├── dev.json              ← Dev environment config
│   │   ├── qa.json               ← QA environment config
│   │   ├── staging.json          ← Staging environment config
│   │   └── prod.json             ← Prod environment config (use with caution!)
│   ├── locators.json             ← Centralized page locator definitions
│   └── test-users.json           ← Test user accounts & roles
│
├── hooks/                        ← Global lifecycle hooks
│   ├── auth-setup.ts             ← Runs ONCE before all tests (login & save auth state)
│   └── data-cleanup.ts           ← Runs ONCE after all tests (teardown & cleanup)
│
├── pages/                        ← Page Object Model (POM) layer
│   ├── base/
│   │   ├── base-page.ts          ← Base class: Pega waits, assertions, helpers
│   │   └── base-api-service.ts   ← Base API class: OAuth token mgmt, request helpers
│   ├── constellation/
│   │   ├── const-navigation.ts   ← Constellation nav bar, search, menu
│   │   ├── const-dashboard.ts    ← Dashboard widgets, shortcuts
│   │   ├── const-case-flow.ts    ← Case creation, editing, submission
│   │   └── const-workbasket.ts   ← Workbasket list, assignment actions
│   ├── traditional/
│   │   ├── trd-navigation.ts     ← Traditional UI nav (iframe handling)
│   │   └── trd-case-flow.ts      ← Traditional UI case operations
│   └── shared/
│       └── login-page.ts         ← Login flow (shared across UI variants)
│
├── services/                     ← API service layer (bypasses UI)
│   ├── case-api.ts               ← Case CRUD via REST/PEGA API
│   ├── assignment-api.ts         ← Assignment operations via REST
│   └── user-api.ts               ← User/role queries via REST
│
├── utils/                        ← Shared utilities
│   ├── logger.ts                 ← Structured logging
│   ├── data-generator.ts         ← Random data for test cases
│   ├── wait-helpers.ts           ← Custom wait conditions
│   └── assert-helpers.ts         ← Custom assertions
│
├── tests/                        ← Test files
│   ├── e2e/
│   │   ├── constellation/
│   │   │   ├── case-creation.spec.ts
│   │   │   └── workbasket-operations.spec.ts
│   │   └── traditional/
│   │       └── (future)
│   ├── api/
│   │   ├── case-api.spec.ts
│   │   ├── assignment-api.spec.ts
│   │   └── user-api.spec.ts
│   └── regression/
│       └── smoke-suite.spec.ts   ← Quick smoke test across all modules
│
├── reports/                      ← Generated at runtime
│   ├── playwright/
│   │   ├── html/                 ← HTML test report
│   │   └── results.json          ← JSON results for CI
│   ├── screenshots/              ← Failure screenshots
│   ├── videos/                   ← Failure video recordings
│   └── traces/                   ← Playwright traces for debugging
│
├── .github/workflows/
│   └── ci-playwright.yml         ← CI pipeline
│
└── docs/
    └── END-TO-END-GUIDE.md       ← This file
```

---

## 2. How a Test Executes — Step by Step

Here is the complete lifecycle of a single test run, from `npm test` to final report.

### Phase 0: Bootstrap

```
User runs: npm test -- --project=chromium
```

1. **Playwright reads `playwright.config.ts`**
   - Loads `testDir: './tests'` — all `.spec.ts` files under `tests/`
   - Sets `fullyParallel: true` — tests in the same file can run concurrently
   - Configures browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
   - Sets reporter: HTML report (local) or JSON + GitHub (CI)
   - Sets `globalSetup` and `globalTeardown` hooks

2. **TypeScript compilation**
   - `tsconfig.json` compiles all `.ts` files on the fly via `@playwright/test`'s built-in loader
   - No separate build step needed

### Phase 1: Global Setup (runs once, before any test)

`hooks/auth-setup.ts` executes:

```
1. Load environment config (PEGA_ENV=dev → config/environments/dev.json)
2. Resolve environment variable placeholders (${PEGA_USERNAME} → actual value)
3. Launch Chromium (headless in CI, headed locally if configured)
4. Create browser context with viewport, locale, timezone settings
5. Navigate to Pega login: ${baseUrl}/prweb
6. Fill username and password fields
7. Click sign-in button
8. Wait for navigation to complete
9. Save authenticated cookies/localStorage to reports/auth-state.json
10. Close browser
```

**Result:** `reports/auth-state.json` now contains authenticated session cookies.
Every test can replay this state without logging in again.

### Phase 2: Test Execution (per test, in parallel)

Each test file follows this lifecycle:

#### Step 1: Playwright creates a fresh browser context
- Loads `storageState: './reports/auth-state.json'` from global setup
- Browser starts with Pega login cookies already present — no login needed per test
- Each test gets an isolated browser context (cookies, storage, etc. are separate)

#### Step 2: Test fixture injection
```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  // `page` is automatically created, navigated, and managed by Playwright
  // It already has auth cookies from global setup
});
```

#### Step 3: Page Object instantiation
```typescript
const loginPage = new LoginPage(page);
const caseFlow = new ConstellationCaseFlow(page);
const navigation = new ConstellationNavigation(page);
// Page objects share the same `page` instance
```

#### Step 4: Test steps execute sequentially
```
1. Navigate to Pega: page.goto(baseURL + '/prweb')
2. Login: loginPage.login(username, password)
   → Fills fields, clicks submit, waits for Pega loading to finish
3. Verify logged in: loginPage.expectLoggedIn()
   → Asserts home page elements are visible
4. Navigate: navigation.goToWorkbasket()
   → Clicks nav bar elements, waits for Pega AJAX
5. Perform action: caseFlow.startNewCase('Standard')
   → Finds case template, fills fields, handles modals
6. Submit: caseFlow.submitCase()
   → Clicks submit, waits for confirmation toast
7. Assert: expect(caseId).toBeTruthy()
   → Validates results using Playwright assertions
```

#### Step 5: Pega-specific waits (inside every action)
Every page method calls one of these after interacting with Pega:
- `waitForPegaLoading()` — waits for `.pi-icon-loading` spinner to detach
- `waitForActivityComplete()` — waits for `networkidle` + 500ms buffer
- `handleModal()` — auto-dismisses Pega modal dialogs

### Phase 3: Global Teardown (runs once, after all tests)

`hooks/data-cleanup.ts` executes:

```
1. Launch browser (with auth state)
2. Navigate to admin endpoints
3. Delete any test cases created during the run
4. Clean up temporary test users/data
5. Close browser
```

### Phase 4: Report Generation

```
reports/playwright/html/index.html   ← Interactive HTML report
reports/playwright/results.json      ← Machine-readable JSON for CI
reports/screenshots/                   ← Failure screenshots (*.png)
reports/videos/                      ← Failure videos (webm)
reports/traces/                      ← Full interaction traces
```

---

## 3. The Page Object Model — How It's Structured

### 3.1 Base Layer (`pages/base/base-page.ts`)

All Pega page objects extend `BasePage`, which provides:

| Method | Purpose |
|--------|---------|
| `waitForPegaLoading()` | Waits for Pega's loading spinner to disappear |
| `waitForActivityComplete()` | Waits for network idle + rendering buffer |
| `handleModal()` | Auto-dismisses Pega confirmation dialogs |
| `assertToast(message, type)` | Asserts a toast notification appeared |
| `fillField(fieldId, value)` | Fills a Pega field by `data-test-id` or label |
| `selectDropdownOption(id, value)` | Selects from a Pega dropdown |
| `clickAction(actionId)` | Clicks a Pega action button |
| `takeScreenshot(name)` | Captures full-page screenshot |

### 3.2 UI Variants

Pega has two UI frameworks — each gets its own page objects:

```
pages/
├── constellation/     ← Modern Angular-based UI (Pega 8+)
│   ├── const-navigation.ts     ← Top nav, search, menu items
│   ├── const-dashboard.ts      ← Dashboard widgets, worklists
│   ├── const-case-flow.ts      ← Case creation/edit form
│   └── const-workbasket.ts     ← Workbasket assignments
│
├── traditional/       ← Classic JSP-based UI
│   ├── trd-navigation.ts       ← Left nav (handles iframes)
│   └── trd-case-flow.ts        ← Case form operations
```

**Key difference:** Traditional UI uses iframes (`pega` iframe), so `trd-navigation.ts` and `trd-case-flow.ts` handle frame switching. Constellation UI is a single-page app, so it uses standard navigation.

### 3.3 Shared Components

```
pages/shared/
└── login-page.ts      ← Login flow used by both UI variants
```

### 3.4 Locator Strategy

Locators are defined in **three layers** (checked in order):

1. **Explicit `data-test-id` attributes** — best practice, added by developers
2. **CSS class patterns** — framework-specific selectors (e.g., `[class*="toast"]`)
3. **Label text** — `page.getByLabel(fieldId)` as final fallback

For custom locators, edit `config/locators.json`:
```json
{
  "case-form": {
    "customer-name": "[data-test-id=\"field-customer-name\"]",
    "case-type": "[data-test-id=\"dropdown-case-type\"]",
    "submit-btn": "[data-test-id=\"btn-submit-case\"]"
  }
}
```

---

## 4. API Testing — How It Works

The API layer (`services/`) bypasses the UI entirely and calls Pega's REST endpoints directly.

### 4.1 Authentication

`base-api-service.ts` handles OAuth token management:

```typescript
const apiService = new BaseApiService(page);
// Automatically fetches and caches OAuth tokens from the authenticated browser context
```

### 4.2 Service Classes

| Service | Endpoints | Purpose |
|---------|-----------|---------|
| `CaseApi` | `/api/v1/cases`, `/api/v1/cases/:id` | CRUD cases, query by status |
| `AssignmentApi` | `/api/v1/assignments`, `/api/v1/assignments/:id` | List, claim, resolve assignments |
| `UserApi` | `/api/v1/users`, `/api/v1/users/:id` | Query users, roles, groups |

### 4.3 Example API Test

```typescript
import { test, expect } from '@playwright/test';
import { CaseApi } from '../../services/case-api';

test('should create a case via API', async ({ page }) => {
  const caseApi = new CaseApi(page);

  // Create case via REST
  const payload = generateSampleCasePayload();
  const createdCase = await caseApi.create(payload);

  // Assert
  expect(createdCase.status).toBe('Open');
  expect(createdCase.caseId).toBeTruthy();

  // Verify via API that case exists
  const fetchedCase = await caseApi.getById(createdCase.caseId);
  expect(fetchedCase.status).toBe('Open');
});
```

---

## 5. Test Organization & Tagging

### 5.1 Directory Structure

```
tests/
├── e2e/                  ← Full UI integration tests
│   ├── constellation/    ← Constellation UI tests
│   └── traditional/      ← Traditional UI tests
├── api/                  ← API-only tests (no browser)
└── regression/           ← Cross-module regression suites
    └── smoke-suite.spec.ts
```

### 5.2 Test Tagging

Use `@` tags in `test.describe()` for filtering:

```typescript
test.describe('@e2e @ui @constellation @smoke Case Creation', () => {
  test('should create a new case', async ({ page }) => { ... });
});
```

**Filter by tag:**
```bash
npx playwright test --grep="@smoke"          # Only smoke tests
npx playwright test --grep="@api"            # Only API tests
npx playwright test --grep="@constellation"  # Only Constellation tests
```

### 5.3 Test Groups

```typescript
test.describe('Case Operations', () => {
  test('should create a case', ...);
  test('should edit a case', ...);
  test('should close a case', ...);
});
```

Playwright groups tests hierarchically in the HTML report.

---

## 6. Configuration System

### 6.1 Environment Configs

Each environment has its own JSON file:

```json
// config/environments/qa.json
{
  "baseUrl": "https://qa-pega.example.com",
  "appName": "MyPegaApp",
  "apiBase": "https://qa-pega.example.com/prapi",
  "testUsers": [
    {
      "username": "PEGA-Admin1",
      "password": "${QA_ADMIN_PASS}",
      "role": "admin"
    },
    {
      "username": "PEGA-User1",
      "password": "${QA_USER_PASS}",
      "role": "analyst"
    }
  ],
  "browser": {
    "headless": true,
    "viewport": { "width": 1920, "height": 1080 },
    "locales": "en-US",
    "timezone": "America/New_York"
  }
}
```

**Environment variable placeholders** (`${VAR_NAME}`) are resolved at global setup time.

### 6.2 Test Users

```json
// config/test-users.json
{
  "analyst": {
    "username": "PEGA-User1",
    "password": "password",
    "role": "analyst",
    "accessGroups": ["PEGA-ANALYST"]
  },
  "manager": {
    "username": "PEGA-User2",
    "password": "password",
    "role": "manager",
    "accessGroups": ["PEGA-MANAGER"]
  }
}
```

### 6.3 Environment Selection

```bash
PEGA_ENV=qa npm test                      # Run against QA
PEGA_ENV=staging npx playwright test      # Run against staging
PEGA_BASE_URL=https://my-pega.com npm test  # Override base URL directly
```

---

## 7. Reporting & Artifacts

### 7.1 What Gets Generated

| Artifact | Location | When |
|----------|----------|------|
| HTML report | `reports/playwright/html/index.html` | Every run (local) |
| JSON results | `reports/playwright/results.json` | Every run (CI) |
| Screenshots | `reports/screenshots/` | On test failure |
| Videos | `reports/videos/` | On test failure |
| Traces | `reports/traces/` | On first retry of failure |

### 7.2 Viewing Reports

```bash
# Local HTML report
npx playwright show-report

# Or open directly
open reports/playwright/html/index.html
```

The HTML report shows:
- Test status (passed/failed/flaky)
- Duration per test
- Screenshot thumbnails on failure
- Step-by-step trace view
- Network request waterfall
- Console logs

### 7.3 CI Integration

In CI (`reports/playwright/results.json`):
- GitHub Actions uses the `github` reporter for PR annotations
- JSON output can be parsed by any CI system (Jenkins, GitLab, etc.)
- Exit code 1 on any failure, 0 on success

---

## 8. Writing New Tests — A Template

### 8.1 UI Test Template

```typescript
// tests/e2e/constellation/my-feature.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/shared/login-page';
import { SomeFeaturePage } from '../../pages/constellation/some-feature-page';

test.describe('@e2e @ui @constellation My Feature', () => {
  test('should do X when user does Y', async ({ page }) => {
    // 1. Setup
    const loginPage = new LoginPage(page);
    const featurePage = new SomeFeaturePage(page);

    // 2. Navigate & Login
    await page.goto(`${config.baseUrl}/prweb`);
    await loginPage.login(config.testUsers[0].username, config.testUsers[0].password);
    await loginPage.expectLoggedIn();

    // 3. Navigate to feature
    await featurePage.navigateTo();
    await featurePage.expectOnPage();

    // 4. Perform action
    await featurePage.performAction();

    // 5. Assert result
    await featurePage.expectResult();
  });
});
```

### 8.2 API Test Template

```typescript
// tests/api/my-feature.spec.ts
import { test, expect } from '@playwright/test';
import { CaseApi } from '../../services/case-api';

test.describe('@api Case API', () => {
  test('should create and retrieve a case', async ({ page }) => {
    const caseApi = new CaseApi(page);
    const payload = generateSampleCasePayload();

    // Create
    const created = await caseApi.create(payload);
    expect(created.status).toBe('Open');

    // Retrieve
    const fetched = await caseApi.getById(created.caseId);
    expect(fetched.caseId).toBe(created.caseId);
    expect(fetched.status).toBe('Open');
  });
});
```

### 8.3 New Page Object Template

```typescript
// pages/constellation/some-feature-page.ts
import { BasePage } from '../base/base-page';
import { Page } from '@playwright/test';

export class SomeFeaturePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(`${this.baseUrl}/prweb/app-name/SomeFeature`);
    await this.waitForPegaLoading();
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page.locator('[data-test-id="feature-header"]')).toBeVisible();
  }

  async performAction(): Promise<void> {
    await this.page.locator('[data-test-id="btn-action"]').click();
    await this.waitForPegaLoading();
    await this.handleModal();
  }

  async expectResult(): Promise<void> {
    await this.assertToast('Action completed successfully', 'success');
  }
}
```

---

## 9. Running Tests — Commands Reference

```bash
# Install dependencies
npm ci

# Install browser binaries
npx playwright install --with-deps

# Run all tests (all browsers)
npm test

# Run against a single browser
npx playwright test --project=chromium

# Run a single test file
npx playwright test tests/e2e/constellation/case-creation.spec.ts

# Run a single test (by name)
npx playwright test --grep "should create a new case"

# Run only smoke tests
npx playwright test --grep "@smoke"

# Run only API tests
npx playwright test --grep "@api"

# Run in headed mode (see the browser)
npx playwright test --headed

# Run in debug mode (Playwright inspector)
npx playwright test --debug

# Generate HTML report
npx playwright show-report

# Run with specific environment
PEGA_ENV=qa npm test

# Run with custom base URL
PEGA_BASE_URL=https://my-pega.com npx playwright test

# Run with debug logging
PWDEBUG=1 npx playwright test
```

---

## 10. CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-playwright.yml`) runs:

| Stage | Command | Purpose |
|-------|---------|---------|
| **API Tests** | `npx playwright test --grep "@api"` | Fast REST validation |
| **Smoke Tests** | `npx playwright test --grep "@smoke"` | Quick health check |
| **Full E2E** | `npx playwright test` | Complete UI suite |

Each stage runs across Chromium, Firefox, and WebKit (3 workers in CI).
Failed tests retry 2x automatically. Traces are uploaded for debugging.

---

## 11. Debugging Tips

### 11.1 Interactive Debugging

```bash
# Open Playwright Inspector
npx playwright test --debug tests/e2e/constellation/case-creation.spec.ts

# Step through with Playwright Codegen (record & generate)
npx playwright codegen http://my-pega.com/prweb
```

### 11.2 Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Tests fail with auth errors | Global setup didn't save auth state | Check `reports/auth-state.json` exists |
| Element not found | Pega hasn't finished rendering | Add `await caseFlow.waitForPegaLoading()` |
| Flaky tests | Race conditions with Pega AJAX | Use `waitForActivityComplete()` before asserts |
| Tests pass locally but fail in CI | Headless vs headed differences | Run locally with `--headed` to compare |
| Stale cookies | Auth state expired | Increase session timeout or refresh in global setup |

### 11.3 Trace Analysis

When a test fails in CI, download the trace from the HTML report:
```bash
# Download trace from CI artifacts
# Then replay it locally
npx playwright show-trace reports/traces/<trace-file>.zip
```

The trace shows every DOM change, network request, and action in chronological order.

---

## 12. Quick Reference — File Purposes

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Browser config, timeouts, reporters, global hooks |
| `hooks/auth-setup.ts` | One-time login, saves auth cookies |
| `hooks/data-cleanup.ts` | One-time cleanup after all tests |
| `pages/base/base-page.ts` | Pega-specific waits & helpers for all page objects |
| `pages/base/base-api-service.ts` | OAuth token mgmt & HTTP request helpers |
| `pages/shared/login-page.ts` | Login flow (shared by Constellation & Traditional) |
| `pages/constellation/*.ts` | Constellation UI page objects |
| `pages/traditional/*.ts` | Traditional UI page objects (iframe-aware) |
| `services/*.ts` | Direct REST API calls (no browser needed) |
| `utils/*.ts` | Shared helpers (logging, data gen, waits, assertions) |
| `config/environments/*.json` | Per-environment settings (URLs, users, browser config) |
| `config/locators.json` | Centralized locator definitions |
| `config/test-users.json` | Test user accounts |
| `tests/e2e/**/*.spec.ts` | Full UI integration tests |
| `tests/api/**/*.spec.ts` | API-only tests |
| `tests/regression/*.spec.ts` | Cross-module regression/smoke suites |
