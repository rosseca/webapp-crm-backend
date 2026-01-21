import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  AuthRepositoryFactory,
  AuthApiConfigProvider,
} from './repositories/auth-repository.factory';
import { AUTH_REPOSITORY } from './repositories/auth.repository.interface';
import { FirestoreModule } from '../common/firestore/firestore.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
    FirestoreModule,
  ],
  controllers: [AuthController],
  providers: [AuthApiConfigProvider, AuthRepositoryFactory, AuthService],
  exports: [AuthService, AUTH_REPOSITORY],
})
export class AuthModule {}
