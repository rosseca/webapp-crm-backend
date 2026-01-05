import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  AuthRepositoryFactory,
  AuthApiConfigProvider,
} from './repositories/auth-repository.factory';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthApiConfigProvider, AuthRepositoryFactory, AuthService],
  exports: [AuthService],
})
export class AuthModule {}
