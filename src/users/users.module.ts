import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository, CHATAI_API_CONFIG } from './repositories/users.repository';
import { USERS_REPOSITORY } from './repositories/users.repository.interface';
import { ApiRepositoryConfig } from '../common/repositories/base-api.repository';

const ChatAIApiConfigProvider = {
  provide: CHATAI_API_CONFIG,
  useFactory: (configService: ConfigService): ApiRepositoryConfig => ({
    baseUrl: configService.get<string>('CHATAI_API_URL') || 'http://localhost:5001',
    timeout: configService.get<number>('CHATAI_API_TIMEOUT') || 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  }),
  inject: [ConfigService],
};

const UsersRepositoryProvider = {
  provide: USERS_REPOSITORY,
  useClass: UsersRepository,
};

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [UsersController],
  providers: [ChatAIApiConfigProvider, UsersRepositoryProvider, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
