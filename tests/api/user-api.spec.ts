/**
 * API tests for Pega User REST API
 */
import { test, expect } from '@playwright/test';
import { UserApiService } from '../../services/user-api';

test.describe('@api User REST API', () => {
  let userApi: UserApiService;
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

    userApi = new UserApiService({
      baseUrl: config.baseUrl,
      username: config.testUsers[0].username,
      password: config.testUsers[0].password,
      appName: config.appName,
    });
  });

  test('should get current user', async () => {
    const user = await userApi.getCurrentUser();
    expect(user).toBeDefined();
    expect(user.pyID).toBeTruthy();
  });

  test('should get user profile', async () => {
    const user = await userApi.getUserProfile('PEGA-User1');
    expect(user).toBeDefined();
    expect(user.pyID).toBe('PEGA-User1');
  });

  test('should get user roles', async () => {
    const roles = await userApi.getUserRoles('PEGA-User1');
    expect(Array.isArray(roles)).toBe(true);
  });

  test('should check access role', async () => {
    const hasRole = await userApi.hasAccessRole('PEGA-User1', 'UserAccess');
    expect(typeof hasRole).toBe('boolean');
  });
});
