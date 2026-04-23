# Pega Test Automation Framework

Playwright-based hybrid (API + UI) test automation framework for Pega applications.

## Features

- **Hybrid Testing**: Both UI (Playwright) and API (REST) testing in one framework
- **Pega-Specific**: Built-in support for Pega Constellation and Traditional UI
- **Multi-Browser**: Chromium, Firefox, WebKit, and mobile viewports
- **Page Object Model**: Clean, maintainable page object architecture
- **API Services**: Dedicated REST API clients for Pega Case, Assignment, and User APIs
- **Configurable**: Environment-specific configuration (dev, qa, staging, prod)
- **CI/CD Ready**: GitHub Actions pipeline included
- **Reporting**: HTML reports, screenshots on failure, video recording
- **Test Tagging**: Organize tests with tags (`@smoke`, `@api`, `@ui`, `@constellation`, etc.)

## Prerequisites

- Node.js 20+
- npm or yarn
- Access to a Pega environment

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd pega-test-framework

# Install dependencies
npm ci

# Install Playwright browsers
npx playwright install --with-deps

# Set environment variables
export PEGA_BASE_URL=https://pega-qa.example.com
export PEGA_USERNAME=PEGA-User1
export PEGA_PASSWORD=your-password
export PEGA_ENV=qa

# Run all tests
npm test

# Run only API tests
npm run test:api

# Run only smoke tests
npm run test:smoke

# Run tests in headed mode (for debugging)
npm run test:headed

# View HTML report
npm run test:report
```

## Project Structure

```
pega-test-framework/
├── playwright.config.ts      # Playwright configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
├── .gitignore
│
├── config/
│   ├── environments/         # Environment-specific configs
│   │   ├── dev.json
│   │   ├── qa.json
│   │   ├── staging.json
│   │   └── prod.json
│   ├── test-users.json       # Test user definitions
│   └── locators.json         # Global locator mappings
│
├── fixtures/                  # Test data fixtures
│   ├── cases/
│   ├── users/
│   └── responses/
│
├── pages/                     # Page Objects
│   ├── base/
│   │   ├── base-page.ts      # Abstract base page
│   │   └── base-api-service.ts # Abstract API service
│   ├── constellation/         # Constellation UI page objects
│   │   ├── const-navigation.ts
│   │   ├── const-case-flow.ts
│   │   ├── const-workbasket.ts
│   │   └── const-dashboard.ts
│   ├── traditional/           # Traditional UI page objects
│   │   ├── trd-navigation.ts
│   │   └── trd-case-flow.ts
│   └── shared/
│       └── login-page.ts      # Common login page
│
├── services/                  # API Service Objects
│   ├── case-api.ts            # Case REST API
│   ├── assignment-api.ts      # Assignment REST API
│   └── user-api.ts            # User REST API
│
├── tests/                     # Test files
│   ├── e2e/
│   │   ├── constellation/
│   │   │   ├── case-creation.spec.ts
│   │   │   └── workbasket-operations.spec.ts
│   │   └── traditional/
│   ├── api/
│   │   ├── case-api.spec.ts
│   │   ├── assignment-api.spec.ts
│   │   └── user-api.spec.ts
│   └── regression/
│       └── smoke-suite.spec.ts
│
├── hooks/
│   ├── auth-setup.ts          # Global auth setup
│   └── data-cleanup.ts        # Global data cleanup
│
├── utils/
│   ├── logger.ts              # Structured logging
│   ├── data-generator.ts      # Test data generation
│   ├── wait-helpers.ts        # Pega-specific wait utilities
│   └── assert-helpers.ts      # Custom assertions
│
├── reports/                   # Test reports (gitignored)
│   ├── playwright/
│   └── allure-results/
│
└── .github/workflows/
    └── ci-playwright.yml      # GitHub Actions CI pipeline
```

## Configuration

### Environment Configuration

Each environment has its own config file in `config/environments/`. Example:

```json
{
  "baseUrl": "https://pega-qa.example.com",
  "appName": "MyPegaApp",
  "defaultTimeout": 30000,
  "testUsers": [
    {
      "username": "PEGA-User1",
      "password": "${PEGA_QA_PASSWORD}",
      "role": "User",
      "accessRole": "UserAccess"
    }
  ]
}
```

Environment variable placeholders (`${VAR_NAME}`) are resolved at runtime.

### Running Tests Against Different Environments

```bash
# Use QA environment (default)
export PEGA_ENV=qa
npm test

# Use staging environment
export PEGA_ENV=staging
npm test
```

## Test Tags

Use tags to organize and filter tests:

| Tag | Purpose |
|-----|---------|
| `@ui` | UI-based test |
| `@api` | API-only test |
| `@constellation` | Constellation UI specific |
| `@traditional` | Traditional UI specific |
| `@smoke` | Smoke/sanity test |
| `@regression` | Full regression test |
| `@e2e` | End-to-end test |

### Running tagged tests

```bash
# Run only smoke tests
npm run test:smoke

# Run only API tests
npm run test:api

# Run only Constellation tests
npm run test:constellation

# Run only regression tests
npm run test:regression
```

## Pega Locator Strategy

The framework follows this priority order for locators:

1. **`data-test-id`** — Pega's recommended automation attribute
2. **`data-testid` / `data-qa`** — Constellation standard
3. **ARIA role + label** — Playwright's `getByRole()`, `getByLabel()`
4. **CSS class** — Only stable Pega framework classes
5. **XPath** — Last resort only

```typescript
// ✅ Preferred
const submitBtn = page.locator('[data-test-id="btn-submit"]');
const saveBtn = page.getByRole('button', { name: 'Save' });

// ⚠️ Last resort
const element = page.locator('//div[contains(@class, "pega")]');
```

## Adding New Tests

### UI Test Example

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/shared/login-page';
import { ConstellationCaseFlow } from '../pages/constellation/const-case-flow';

test('@e2e @ui @constellation should create a case', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const caseFlow = new ConstellationCaseFlow(page);

  // Login
  await page.goto(`${process.env.PEGA_BASE_URL}/prweb`);
  await loginPage.login('PEGA-User1', process.env.PEGA_PASSWORD!);
  await loginPage.expectLoggedIn();

  // Create case
  await caseFlow.startNewCase('Standard');
  await caseFlow.fillCaseFields({
    'Customer.FirstName': 'Test',
    'Customer.LastName': 'User',
  });
  await caseFlow.submitCase();

  // Verify
  const caseId = await caseFlow.getCaseId();
  expect(caseId).toBeTruthy();
});
```

### API Test Example

```typescript
import { test, expect } from '@playwright/test';
import { CaseApiService } from '../services/case-api';

test('@api should create a case', async () => {
  const caseApi = new CaseApiService({
    baseUrl: process.env.PEGA_BASE_URL!,
    username: process.env.PEGA_USERNAME!,
    password: process.env.PEGA_PASSWORD!,
    appName: 'MyPegaApp',
  });

  const result = await caseApi.createCase('Data-MyApp-Case', {
    'Case.Type': 'Standard',
    'WorkItem.AssignedTo': 'PEGA-User1',
  });

  expect(result.pyID).toBeTruthy();
  expect(result.pyStatusValue).toBe('Open');

  // Cleanup
  await caseApi.resolveCase(result.pyID, 'TEST_COMPLETE');
});
```

## CI/CD

The included GitHub Actions pipeline runs:
- API tests on every PR
- Smoke tests on every push
- Full regression suite nightly (Mon-Fri)
- Multi-browser testing on demand

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `PEGA_TEST_USER` | Pega test username |
| `PEGA_TEST_PASSWORD` | Pega test password |

## Troubleshooting

### Common Issues

1. **Tests fail to connect to Pega**: Verify `PEGA_BASE_URL` is correct and accessible
2. **Login fails**: Check credentials and ensure the test user has proper access roles
3. **Locators not found**: Pega UI may have changed — inspect the page and update locators
4. **Flaky tests**: Increase timeouts or add explicit waits for Pega loading indicators

### Debug Mode

```bash
# Run tests in headed mode
npm run test:headed

# Run with Playwright Inspector
npm run test:debug

# Run UI mode (interactive)
npm run test:ui
```

## License

MIT
