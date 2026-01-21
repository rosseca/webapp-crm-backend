import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logging, Log } from '@google-cloud/logging';

export type LogSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface LogContext {
  service: string;
  function: string;
  userId?: string;
  userEmail?: string;
  requestId?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  message: string;
  severity: LogSeverity;
  context: LogContext;
  timestamp: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

@Injectable()
export class GcpLoggingService implements OnModuleInit {
  private logging: Logging;
  private log: Log;
  private readonly logName: string;
  private readonly isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.get<string>('GCP_PROJECT_ID');
    const clientEmail = this.configService.get<string>('GCP_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('GCP_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    this.logName = this.configService.get<string>('GCP_LOG_NAME', 'leadtech-crm');
    this.isEnabled = !!(projectId && clientEmail && privateKey);

    if (this.isEnabled) {
      this.logging = new Logging({
        projectId,
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
      });
      this.log = this.logging.log(this.logName);
    }
  }

  onModuleInit() {
    if (this.isEnabled) {
      console.log(`GCP Logging initialized with log name: ${this.logName}`);
    } else {
      console.warn(
        'GCP Logging not configured. Set GCP_PROJECT_ID, GCP_CLIENT_EMAIL, and GCP_PRIVATE_KEY to enable.',
      );
    }
  }

  private async writeLog(
    severity: LogSeverity,
    message: string,
    context: LogContext,
    error?: Error,
  ): Promise<void> {
    const logEntry: LogEntry = {
      message,
      severity,
      context,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Always log to console for local development
    this.logToConsole(logEntry);

    // Write to GCP if enabled
    if (this.isEnabled) {
      try {
        const entry = this.log.entry(
          {
            severity,
            resource: {
              type: 'global',
            },
            labels: {
              service: context.service,
              function: context.function,
              userId: context.userId || 'anonymous',
            },
          },
          logEntry,
        );
        await this.log.write(entry);
      } catch (err) {
        console.error('Failed to write to GCP Logging:', err);
      }
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.severity}] [${entry.context.service}:${entry.context.function}]`;
    const userInfo = entry.context.userEmail
      ? ` [User: ${entry.context.userEmail}]`
      : entry.context.userId
        ? ` [UserId: ${entry.context.userId}]`
        : '';

    const message = `${prefix}${userInfo} ${entry.message}`;

    switch (entry.severity) {
      case 'ERROR':
      case 'CRITICAL':
        console.error(message, entry.error?.stack || '');
        break;
      case 'WARNING':
        console.warn(message);
        break;
      case 'DEBUG':
        console.debug(message);
        break;
      default:
        console.log(message);
    }
  }

  async debug(message: string, context: LogContext): Promise<void> {
    await this.writeLog('DEBUG', message, context);
  }

  async info(message: string, context: LogContext): Promise<void> {
    await this.writeLog('INFO', message, context);
  }

  async warn(message: string, context: LogContext): Promise<void> {
    await this.writeLog('WARNING', message, context);
  }

  async error(
    message: string,
    context: LogContext,
    error?: Error,
  ): Promise<void> {
    await this.writeLog('ERROR', message, context, error);
  }

  async critical(
    message: string,
    context: LogContext,
    error?: Error,
  ): Promise<void> {
    await this.writeLog('CRITICAL', message, context, error);
  }

  /**
   * Helper to create a scoped logger for a specific service
   */
  forService(serviceName: string): ServiceLogger {
    return new ServiceLogger(this, serviceName);
  }
}

/**
 * Scoped logger for a specific service - makes logging cleaner in services
 */
export class ServiceLogger {
  constructor(
    private readonly loggingService: GcpLoggingService,
    private readonly serviceName: string,
  ) {}

  private createContext(
    functionName: string,
    extra?: Partial<LogContext>,
  ): LogContext {
    return {
      service: this.serviceName,
      function: functionName,
      ...extra,
    };
  }

  async debug(
    functionName: string,
    message: string,
    extra?: Partial<LogContext>,
  ): Promise<void> {
    await this.loggingService.debug(message, this.createContext(functionName, extra));
  }

  async info(
    functionName: string,
    message: string,
    extra?: Partial<LogContext>,
  ): Promise<void> {
    await this.loggingService.info(message, this.createContext(functionName, extra));
  }

  async warn(
    functionName: string,
    message: string,
    extra?: Partial<LogContext>,
  ): Promise<void> {
    await this.loggingService.warn(message, this.createContext(functionName, extra));
  }

  async error(
    functionName: string,
    message: string,
    error?: Error,
    extra?: Partial<LogContext>,
  ): Promise<void> {
    await this.loggingService.error(
      message,
      this.createContext(functionName, extra),
      error,
    );
  }

  async critical(
    functionName: string,
    message: string,
    error?: Error,
    extra?: Partial<LogContext>,
  ): Promise<void> {
    await this.loggingService.critical(
      message,
      this.createContext(functionName, extra),
      error,
    );
  }

  /**
   * Log method execution with timing
   */
  async logMethodExecution<T>(
    functionName: string,
    operation: () => Promise<T>,
    extra?: Partial<LogContext>,
  ): Promise<T> {
    const startTime = Date.now();
    await this.info(functionName, `Starting ${functionName}`, extra);

    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      await this.info(functionName, `Completed ${functionName}`, {
        ...extra,
        duration,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.error(
        functionName,
        `Failed ${functionName}`,
        error instanceof Error ? error : new Error(String(error)),
        { ...extra, duration },
      );
      throw error;
    }
  }
}
