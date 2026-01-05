import { HttpException, HttpStatus } from '@nestjs/common';

export interface RepositoryExceptionDetails {
  originalError?: string;
  details?: Record<string, unknown>;
  endpoint?: string;
  [key: string]: unknown;
}

export class RepositoryException extends HttpException {
  public readonly details: RepositoryExceptionDetails;

  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details: RepositoryExceptionDetails = {},
  ) {
    super(
      {
        message,
        error: 'RepositoryError',
        statusCode: status,
        details,
      },
      status,
    );
    this.details = details;
  }

  static notFound(resource: string, id: string): RepositoryException {
    return new RepositoryException(
      `${resource} with id '${id}' not found`,
      HttpStatus.NOT_FOUND,
      { resource, id },
    );
  }

  static connectionFailed(
    service: string,
    details?: RepositoryExceptionDetails,
  ): RepositoryException {
    return new RepositoryException(
      `Failed to connect to ${service}`,
      HttpStatus.SERVICE_UNAVAILABLE,
      { service, ...details },
    );
  }

  static validationError(
    message: string,
    details?: Record<string, unknown>,
  ): RepositoryException {
    return new RepositoryException(message, HttpStatus.BAD_REQUEST, {
      validationErrors: details,
    });
  }

  static unauthorized(message = 'Unauthorized'): RepositoryException {
    return new RepositoryException(message, HttpStatus.UNAUTHORIZED);
  }
}
