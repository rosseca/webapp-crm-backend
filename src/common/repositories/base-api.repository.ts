import { Injectable, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, firstValueFrom, catchError, timeout, retry } from 'rxjs';
import { ApiErrorResponse } from '../interfaces/api-response.interface';
import { RepositoryException } from '../exceptions/repository.exception';

export interface ApiRepositoryConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  headers?: Record<string, string>;
}

@Injectable()
export abstract class BaseApiRepository {
  protected readonly defaultTimeout = 10000;
  protected readonly defaultRetryAttempts = 3;

  constructor(
    protected readonly httpService: HttpService,
    protected readonly config: ApiRepositoryConfig,
  ) {}

  protected async get<T>(
    endpoint: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.executeRequest<T>('GET', endpoint, undefined, config);
  }

  protected async post<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.executeRequest<T>('POST', endpoint, data, config);
  }

  protected async put<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.executeRequest<T>('PUT', endpoint, data, config);
  }

  protected async patch<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.executeRequest<T>('PATCH', endpoint, data, config);
  }

  protected async delete<T>(
    endpoint: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.executeRequest<T>('DELETE', endpoint, undefined, config);
  }

  private async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const requestConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        ...this.config.headers,
        ...config?.headers,
      },
    };

    try {
      let observable: Observable<AxiosResponse<T>>;

      switch (method) {
        case 'GET':
          observable = this.httpService.get<T>(url, requestConfig);
          break;
        case 'POST':
          observable = this.httpService.post<T>(url, data, requestConfig);
          break;
        case 'PUT':
          observable = this.httpService.put<T>(url, data, requestConfig);
          break;
        case 'PATCH':
          observable = this.httpService.patch<T>(url, data, requestConfig);
          break;
        case 'DELETE':
          observable = this.httpService.delete<T>(url, requestConfig);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      const timeoutMs = this.config.timeout ?? this.defaultTimeout;
      const response = await firstValueFrom(
        observable.pipe(
          timeout({ each: timeoutMs }),
          retry({
            count: this.config.retryAttempts ?? this.defaultRetryAttempts,
            delay: 1000,
            resetOnSuccess: true,
          }),
          catchError((error: AxiosError) => {
            throw this.handleApiError(error);
          }),
        ),
      );

      return response.data;
    } catch (error) {
      if (error instanceof RepositoryException) {
        throw error;
      }
      throw this.handleApiError(error as AxiosError);
    }
  }

  protected buildUrl(endpoint: string): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    return `${baseUrl}/${cleanEndpoint}`;
  }

  protected handleApiError(error: AxiosError): RepositoryException {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as ApiErrorResponse;

      return new RepositoryException(data?.message || error.message, status, {
        originalError: error.message,
        details: data?.details,
        endpoint: error.config?.url,
      });
    } else if (error.request) {
      return new RepositoryException(
        'External service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
        {
          originalError: error.message,
          endpoint: error.config?.url,
        },
      );
    } else {
      return new RepositoryException(
        'Failed to make request to external service',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { originalError: error.message },
      );
    }
  }

  protected withAuth(
    token: string,
    config?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    return {
      ...config,
      headers: {
        ...config?.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}
