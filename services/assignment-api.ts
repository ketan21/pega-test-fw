import { BaseApiService } from '../pages/base/base-api-service';

/**
 * Pega Assignment REST API service
 */
export class AssignmentApiService extends BaseApiService {
  /**
   * List assignments for a user
   */
  async listAssignments(username?: string, status?: string): Promise<any[]> {
    const params: Record<string, string> = {};
    if (username) params.assignedTo = username;
    if (status) params.status = status;
    return this.request('/prweb/api/v1/assignment', { params });
  }

  /**
   * Get assignment details
   */
  async getAssignment(assignmentId: string): Promise<any> {
    return this.request(`/prweb/api/v1/assignment/${assignmentId}`);
  }

  /**
   * Take an assignment
   */
  async takeAssignment(assignmentId: string): Promise<any> {
    return this.request(`/prweb/api/v1/assignment/${assignmentId}/take`, {
      method: 'POST',
    });
  }

  /**
   * Drop an assignment
   */
  async dropAssignment(assignmentId: string): Promise<void> {
    await this.request(`/prweb/api/v1/assignment/${assignmentId}/drop`, {
      method: 'POST',
    });
  }

  /**
   * Resolve an assignment
   */
  async resolveAssignment(assignmentId: string, resolutionCode: string): Promise<any> {
    return this.request(`/prweb/api/v1/assignment/${assignmentId}/resolve`, {
      method: 'PUT',
      body: {
        resolutionCode,
      },
    });
  }

  /**
   * Hold an assignment
   */
  async holdAssignment(assignmentId: string, holdReason: string): Promise<any> {
    return this.request(`/prweb/api/v1/assignment/${assignmentId}/hold`, {
      method: 'POST',
      body: {
        holdReason,
      },
    });
  }

  /**
   * Escalate an assignment
   */
  async escalateAssignment(assignmentId: string, reason: string): Promise<any> {
    return this.request(`/prweb/api/v1/assignment/${assignmentId}/escalate`, {
      method: 'POST',
      body: {
        reason,
      },
    });
  }
}
