export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  statusCode: number;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  error?: string;
  details?: Record<string, unknown>;
}
