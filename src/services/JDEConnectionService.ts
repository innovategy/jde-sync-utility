// src/services/JDEConnectionService.ts

import axios from 'axios';
import * as https from 'https';
import { info, error } from '../utils/logger';

// Define a type for the response data structure
interface TokenResponse {
  userInfo?: {
    token?: string;
  };
}

interface AISConfigResponse {
  aisVersion?: string;
}

/**
 * Service class for managing JD Edwards AIS authentication and connection.
 * Handles token management, HTTPS agent config, and provides an Axios instance for API calls.
 */
export class JDEConnectionService {
  private baseUrl: string;
  private username: string;
  private password: string;
  private environment: string;
  private role: string;
  private httpsAgent: https.Agent;
  private token: string | null = null;
  // Use the specific type for the axios instance
  private axiosInstance: ReturnType<typeof axios.create>;

  /**
   * Reads connection config from environment variables and sets up Axios instance.
   * Uses an HTTPS agent that ignores self-signed cert warnings (for dev/test).
   */
  constructor() {
    // Environment variables for AIS connection config
    this.baseUrl = process.env.AIS_BASE_URL!;
    this.username = process.env.AIS_USERNAME!;
    this.password = process.env.AIS_PASSWORD!;
    this.environment = process.env.AIS_ENVIRONMENT!;
    this.role = process.env.AIS_ROLE!;

    // For development: ignore self-signed certificate errors
    this.httpsAgent = new https.Agent({ rejectUnauthorized: false });

    // Pre-configured Axios instance for all requests
    this.axiosInstance = axios.create({
      // @ts-expect-error - httpsAgent is valid but TypeScript doesn't recognize it
      httpsAgent: this.httpsAgent,
      baseURL: this.baseUrl,
    });
  }

  /**
   * Authenticates with the AIS server and retrieves a session token.
   * Throws on failure. Stores token for future requests.
   */
  async authenticate(): Promise<string> {
    try {
      // POST /v2/tokenrequest with credentials and environment details
      const response = await this.axiosInstance.post<TokenResponse>(
        '/v2/tokenrequest',
        {
          username: this.username,
          password: this.password,
          environment: this.environment,
          role: this.role,
        },
      );

      // Extract and store the session token
      this.token = response.data?.userInfo?.token || null;
      if (!this.token) throw new Error('No token received');

      info('Authenticated successfully.');
      return this.token;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error('Authentication failed:', errorMessage);
      throw err;
    }
  }

  /**
   * Validates the AIS connection by authenticating (if needed) and calling /v2/defaultconfig.
   * Returns true if connection is valid, false otherwise.
   */
  async validateConnection(): Promise<boolean> {
    try {
      // Authenticate if no token is present
      if (!this.token) await this.authenticate();

      // GET /v2/defaultconfig with the stored token
      const response = await this.axiosInstance.get<AISConfigResponse>(
        '/v2/defaultconfig',
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );

      info(
        'Connection validated. AIS Version:',
        response.data?.aisVersion || 'unknown',
      );
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error('Connection validation failed:', errorMessage);
      return false;
    }
  }

  /**
   * Returns the current session token (if authenticated).
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Returns the pre-configured Axios instance for API requests.
   */
  getAxiosInstance(): ReturnType<typeof axios.create> {
    return this.axiosInstance;
  }
}
