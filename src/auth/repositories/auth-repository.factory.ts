import { Provider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Firestore } from '@google-cloud/firestore';
import { AUTH_REPOSITORY, IAuthRepository } from './auth.repository.interface';
import { AuthRepository, AUTH_API_CONFIG } from './auth.repository';
import { FirebaseAuthRepository } from './firebase-auth.repository';
import { PrismaAuthRepository } from './prisma-auth.repository';
import { BaasAuthRepository } from './baas-auth.repository';
import { FirestoreAuthRepository } from './firestore-auth.repository';
import { ApiRepositoryConfig } from '../../common/repositories/base-api.repository';
import { FIRESTORE } from '../../common/firestore/firestore.module';

export enum AuthProviderType {
  API = 'api',
  FIREBASE = 'firebase',
  PRISMA = 'prisma',
  BAAS = 'baas',
  FIRESTORE = 'firestore',
}

const logger = new Logger('AuthRepositoryFactory');

export const AuthRepositoryFactory: Provider = {
  provide: AUTH_REPOSITORY,
  inject: [ConfigService, HttpService, { token: FIRESTORE, optional: true }],
  useFactory: (
    configService: ConfigService,
    httpService: HttpService,
    firestore?: Firestore,
  ): IAuthRepository => {
    const providerType = configService.get<string>(
      'AUTH_PROVIDER',
      AuthProviderType.API,
    );

    logger.log(`Initializing auth repository with provider: ${providerType}`);

    switch (providerType) {
      case AuthProviderType.FIRESTORE:
        if (!firestore) {
          throw new Error(
            'Firestore provider requires FirestoreModule to be imported',
          );
        }
        logger.log('Using Firestore Auth repository');
        return new FirestoreAuthRepository(firestore, configService);

      case AuthProviderType.FIREBASE:
        logger.log('Using Firebase Auth repository');
        return new FirebaseAuthRepository(configService);

      case AuthProviderType.PRISMA:
        logger.log('Using Prisma Auth repository');
        return new PrismaAuthRepository();

      case AuthProviderType.BAAS:
        logger.log('Using BAAS Auth repository (Firebase Identity Toolkit)');
        return new BaasAuthRepository(httpService, configService);

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
