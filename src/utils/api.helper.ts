import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@types/framework.types';
import { Logger } from './logger';
import { config } from '@config/config.manager';

export class ApiHelper {
  private client: AxiosInstance;
  private logger: Logger;
  private authToken?: string;

  constructor(baseUrl?: string) {
    this.logger = new Logger('ApiHelper');

    this.client = axios.create({
      baseURL: baseUrl || config.apiBaseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      req => {
        if (this.authToken) {
          req.headers.Authorization = `Bearer ${this.authToken}`;
        }
        this.logger.debug(`API Request: ${req.method?.toUpperCase()} ${req.url}`);
        return req;
      },
      error => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      res => {
        this.logger.debug(`API Response: ${res.status} ${res.config.url}`);
        return res;
      },
      error => {
        this.logger.error(
          `API Error: ${error.response?.status} ${error.config?.url}`,
          error.response?.data
        );
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = undefined;
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.get(endpoint, { params });
    return this.formatResponse(response);
  }

  async post<T>(
    endpoint: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.post(endpoint, data, config);
    return this.formatResponse(response);
  }

  async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.put(endpoint, data);
    return this.formatResponse(response);
  }

  async patch<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.patch(endpoint, data);
    return this.formatResponse(response);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.delete(endpoint);
    return this.formatResponse(response);
  }

  async authenticate(username: string, password: string): Promise<string> {
    const response = await this.post<{ token: string }>('/auth/login', {
      username,
      password
    });

    const token = response.data.token;
    this.setAuthToken(token);
    this.logger.info('API authentication successful');
    return token;
  }

  private formatResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
    return {
      status: response.status,
      data: response.data,
      headers: response.headers as Record<string, string>
    };
  }
}
