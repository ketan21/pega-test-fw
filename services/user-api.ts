import { BaseApiService } from '../pages/base/base-api-service';

/**
 * Pega User/Security REST API service
 */
export class UserApiService extends BaseApiService {
  /**
   * Get user profile
   */
  async getUserProfile(username: string): Promise<any> {
    return this.request(`/prweb/api/v1/user/${username}`);
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<any> {
    return this.request('/prweb/api/v1/user/me');
  }

  /**
   * Get user roles
   */
  async getUserRoles(username: string): Promise<string[]> {
    const userData = await this.getUserProfile(username);
    return userData.pyRoles || [];
  }

  /**
   * Check if user has a specific access role
   */
  async hasAccessRole(username: string, roleName: string): Promise<boolean> {
    const roles = await this.getUserRoles(username);
    return roles.includes(roleName);
  }
}
