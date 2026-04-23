import { BaseApiService } from '../pages/base/base-api-service';

/**
 * Pega Case REST API service
 */
export class CaseApiService extends BaseApiService {
  /**
   * Create a new case
   */
  async createCase(className: string, params: Record<string, any>): Promise<any> {
    return this.request('/prweb/api/v1/case', {
      method: 'POST',
      body: {
        className,
        parameters: params,
      },
    });
  }

  /**
   * Get a case by its ID
   */
  async getCase(caseId: string): Promise<any> {
    return this.request(`/prweb/api/v1/case/${caseId}`);
  }

  /**
   * Update a case
   */
  async updateCase(caseId: string, params: Record<string, any>): Promise<any> {
    return this.request(`/prweb/api/v1/case/${caseId}`, {
      method: 'PUT',
      body: {
        parameters: params,
      },
    });
  }

  /**
   * Delete (cancel) a case
   */
  async deleteCase(caseId: string): Promise<void> {
    await this.request(`/prweb/api/v1/case/${caseId}`, {
      method: 'DELETE',
    });
  }

  /**
   * List cases for a user
   */
  async listCasesByUser(username: string, status?: string): Promise<any[]> {
    const params: Record<string, string> = {
      assignedTo: username,
    };
    if (status) {
      params.status = status;
    }
    return this.request('/prweb/api/v1/case', { params });
  }

  /**
   * Resolve a case
   */
  async resolveCase(caseId: string, resolutionCode: string): Promise<any> {
    return this.request(`/prweb/api/v1/case/${caseId}/resolve`, {
      method: 'PUT',
      body: {
        resolutionCode,
      },
    });
  }

  /**
   * Get case status
   */
  async getCaseStatus(caseId: string): Promise<string> {
    const caseData = await this.getCase(caseId);
    return caseData.pyStatusValue;
  }
}
