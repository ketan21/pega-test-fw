/**
 * Base API service class that all Pega API service objects extend.
 * Handles authentication, common headers, and error handling.
 */

interface PegaAuthConfig {
  baseUrl: string;
  username: string;
  password: string;
  zone?: string;
  appName: string;
}

interface PegaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface PegaRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, any>;
  params?: Record<string, string>;
}

export abstract class BaseApiService {
  protected readonly baseUrl: string;
  protected readonly username: string;
  protected readonly password: string;
  protected readonly zone?: string;
  protected readonly appName: string;

  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: PegaAuthConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.username = config.username;
    this.password = config.password;
    this.zone = config.zone;
    this.appName = config.appName;
  }

  /**
   * Get or refresh the OAuth token
   */
  protected async getToken(): Promise<string> {
    // Return cached token if not expired
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch(`${this.baseUrl}/prweb/api/v1/authorization/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'password',
        username: this.username,
        password: this.password,
        client_id: 'pega-api',
        ...(this.zone ? { zone: this.zone } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pega authentication failed (${response.status}): ${errorText}`);
    }

    const tokenData: PegaTokenResponse = await response.json();
    this.accessToken = tokenData.access_token;
    // Set expiry with 1-minute buffer
    this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000;

    return this.accessToken;
  }

  /**
   * Make an authenticated request to the Pega API
   */
  protected async request(path: string, options: PegaRequestOptions = {}): Promise<any> {
    const token = await this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const body = options.body ? JSON.stringify(options.body) : undefined;

    const url = new URL(`${this.baseUrl}${path}`);
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: options.method || 'GET',
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pega API error ${response.status} ${options.method || 'GET'} ${path}: ${errorText}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/prweb/api/v1/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
