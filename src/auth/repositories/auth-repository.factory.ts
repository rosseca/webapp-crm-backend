import { Provider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AUTH_REPOSITORY, IAuthRepository } from './auth.repository.interface';
import { AuthRepository, AUTH_API_CONFIG } from './auth.repository';
import { FirebaseAuthRepository } from './firebase-auth.repository';
import { PrismaAuthRepository } from './prisma-auth.repository';
import { ApiRepositoryConfig } from '../../common/repositories/base-api.repository';

export enum AuthProviderType {
  API = 'api',
  FIREBASE = 'firebase',
  PRISMA = 'prisma',
}

const logger = new Logger('AuthRepositoryFactory');

export const AuthRepositoryFactory: Provider = {
  provide: AUTH_REPOSITORY,
  inject: [ConfigService, HttpService],
  useFactory: (
    configService: ConfigService,
    httpService: HttpService,
  ): IAuthRepository => {
    const providerType = configService.get<string>(
      'AUTH_PROVIDER',
      AuthProviderType.API,
    );

    logger.log(`Initializing auth repository with provider: ${providerType}`);

    switch (providerType) {
      case AuthProviderType.FIREBASE:
        logger.log('Using Firebase Auth repository');
        return new FirebaseAuthRepository(configService);

      case AuthProviderType.PRISMA:
        logger.log('Using Prisma Auth repository');
        // When you set up PrismaService, inject it here:
        // return new PrismaAuthRepository(prismaService);
        return new PrismaAuthRepository();

      case AuthProviderType.API:
      default:
        logger.log('Using External API Auth repository');
        const apiConfig: ApiRepositoryConfig = {
          baseUrl: configService.get<string>(
            'AUTH_API_URL',
            'http://localhost:3001',
          ),
          timeout: configService.get<number>('AUTH_API_TIMEOUT', 10000),
          retryAttempts: 3,
          headers: {
            'X-API-Key': configService.get<string>('AUTH_API_KEY', ''),
          },
        };
        return new AuthRepository(httpService, apiConfig);
    }
  },
};

/**
 * Provider for API config (still needed for direct AuthRepository injection)
 */
export const AuthApiConfigProvider: Provider = {
  provide: AUTH_API_CONFIG,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): ApiRepositoryConfig => ({
    baseUrl: configService.get<string>('AUTH_API_URL', 'http://localhost:3001'),
    timeout: configService.get<number>('AUTH_API_TIMEOUT', 10000),
    retryAttempts: 3,
    headers: {
      'X-API-Key': configService.get<string>('AUTH_API_KEY', ''),
    },
  }),
};
