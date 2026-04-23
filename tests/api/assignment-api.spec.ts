/**
 * API tests for Pega Assignment REST API
 */
import { test, expect } from '@playwright/test';
import { AssignmentApiService } from '../../services/assignment-api';

test.describe('@api Assignment REST API', () => {
  let assignmentApi: AssignmentApiService;
  const env = process.env.PEGA_ENV || 'dev';

  test.beforeEach(async () => {
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

    assignmentApi = new AssignmentApiService({
      baseUrl: config.baseUrl,
      username: config.testUsers[0].username,
      password: config.testUsers[0].password,
      appName: config.appName,
    });
  });

  test('should list assignments for a user', async () => {
    const assignments = await assignmentApi.listAssignments('PEGA-User1');
    expect(Array.isArray(assignments)).toBe(true);
  });

  test('should list assignments by status', async () => {
    const assignments = await assignmentApi.listAssignments('PEGA-User1', 'Open');
    expect(Array.isArray(assignments)).toBe(true);
  });
});
