/**
 * API tests for Pega Case REST API
 */
import { test, expect } from '@playwright/test';
import { CaseApiService } from '../../services/case-api';

test.describe('@api Case REST API', () => {
  let caseApi: CaseApiService;
  const env = process.env.PEGA_ENV || 'dev';

  test.beforeEach(async () => {
    // Load config
    const fs = await import('fs');
    const path = await import('path');
    const configPath = path.default.join(__dirname, `../../config/environments/${env}.json`);
    const configContent = fs.default.readFileSync(configPath, 'utf-8');
    let config: any;
    try {
      config = JSON.parse(configContent);
    } catch {
      config = {
        baseUrl: process.env.PEGA_BASE_URL || 'http://localhost:8080',
        appName: process.env.PEGA_APP_NAME || 'MyPegaApp',
        testUsers: [{
          username: process.env.PEGA_USERNAME || 'PEGA-User1',
          password: process.env.PEGA_PASSWORD || 'password',
        }],
      };
    }

    // Resolve env vars
    const resolveEnvVars = (obj: any): any => {
      if (typeof obj === 'string' && obj.startsWith('${') && obj.endsWith('}')) {
        return process.env[obj.slice(2, -1)] || obj;
      }
      if (Array.isArray(obj)) return obj.map(resolveEnvVars);
      if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, resolveEnvVars(v)])
        );
      }
      return obj;
    };
    config = resolveEnvVars(config);

    caseApi = new CaseApiService({
      baseUrl: config.baseUrl,
      username: config.testUsers[0].username,
      password: config.testUsers[0].password,
      appName: config.appName,
    });
  });

  test('health check should pass', async () => {
    const isHealthy = await caseApi.healthCheck();
    expect(isHealthy).toBe(true);
  });

  test('should create a case via API', async () => {
    const caseData = {
      'Case.Type': 'Standard',
      'Case.Priority': 'Normal',
      'WorkItem.AssignedTo': 'PEGA-User1',
      'Customer.FirstName': 'API',
      'Customer.LastName': 'Test',
      'Customer.Email': `api-test-${Date.now()}@example.com`,
    };

    const result = await caseApi.createCase('Data-MyApp-Case', caseData);

    expect(result).toBeDefined();
    expect(result.pyID).toBeTruthy();
    expect(result.pyStatusValue).toBe('Open');
  });

  test('should get a case by ID', async () => {
    // First create a case
    const createResult = await caseApi.createCase('Data-MyApp-Case', {
      'Case.Type': 'Standard',
      'WorkItem.AssignedTo': 'PEGA-User1',
      'Customer.FirstName': 'Get',
      'Customer.LastName': 'Test',
    });

    const caseId = createResult.pyID;

    // Then get it
    const caseData = await caseApi.getCase(caseId);

    expect(caseData).toBeDefined();
    expect(caseData.pyID).toBe(caseId);
    expect(caseData.pyStatusValue).toBe('Open');

    // Cleanup
    await caseApi.resolveCase(caseId, 'TEST_COMPLETE');
  });

  test('should list cases for a user', async () => {
    const cases = await caseApi.listCasesByUser('PEGA-User1');

    expect(Array.isArray(cases)).toBe(true);
  });

  test('should resolve a case', async () => {
    // Create a case
    const createResult = await caseApi.createCase('Data-MyApp-Case', {
      'Case.Type': 'Standard',
      'WorkItem.AssignedTo': 'PEGA-User1',
      'Customer.FirstName': 'Resolve',
      'Customer.LastName': 'Test',
    });

    const caseId = createResult.pyID;

    // Resolve it
    const resolveResult = await caseApi.resolveCase(caseId, 'TEST_COMPLETE');

    expect(resolveResult).toBeDefined();
    expect(resolveResult.pyStatusValue).toBe('Closed');
  });
});
