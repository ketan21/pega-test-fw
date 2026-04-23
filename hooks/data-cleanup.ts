/**
 * Global teardown: clean up test data created during tests
 * This runs once after all tests complete
 */
import * as fs from 'fs';
import * as path from 'path';

export default async function globalTeardown() {
  const env = process.env.PEGA_ENV || 'dev';
  const configPath = path.join(__dirname, '../config/environments', `${env}.json`);

  let config: any;
  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configContent);
  } catch {
    console.log('⚠️ No config found, skipping data cleanup');
    return;
  }

  // Resolve environment variable placeholders
  const resolveEnvVars = (obj: any): any => {
    if (typeof obj === 'string' && obj.startsWith('${') && obj.endsWith('}')) {
      const envVar = obj.slice(2, -1);
      return process.env[envVar] || obj;
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

  console.log('🧹 Global teardown: cleaning up test data...');

  // TODO: Implement Pega API-based cleanup
  // This would call Pega REST APIs to:
  // 1. Close/delete cases created during tests
  // 2. Release any assignments held by test users
  // 3. Clean up any temporary data created

  // Example cleanup pattern (to be implemented when API services are ready):
  /*
  const { CaseApiService } = require('../services/case-api');
  const caseApi = new CaseApiService(config);

  // Get all test cases and clean them up
  const testCases = await caseApi.listCasesByUser(config.testUsers[0].username, 'Open');
  for (const testCase of testCases) {
    await caseApi.resolveCase(testCase.pyID, 'TEST_COMPLETE');
  }
  */

  console.log('✅ Global teardown complete');
}
