import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';
import {
  RefundsRepository,
  CHATAI_API_CONFIG,
} from './repositories/refunds.repository';
import { REFUNDS_REPOSITORY } from './repositories/refunds.repository.interface';
import { ApiRepositoryConfig } from '../common/repositories/base-api.repository';

const ChatAIApiConfigProvider = {
  provide: CHATAI_API_CONFIG,
  useFactory: (configService: ConfigService): ApiRepositoryConfig => {
    const baseUrl =
      configService.get<string>('CHATAI_API_URL') || 'http://localhost:5001';
    // Ensure baseUrl includes /v1 for the BaaS API versioned endpoints
    const normalizedUrl = baseUrl.endsWith('/v1')
      ? baseUrl
      : `${baseUrl.replace(/\/$/, '')}/v1`;
    return {
      baseUrl: normalizedUrl,
      timeout: configService.get<number>('CHATAI_API_TIMEOUT') || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  },
  inject: [ConfigService],
};

const RefundsRepositoryProvider = {
  provide: REFUNDS_REPOSITORY,
  useClass: RefundsRepository,
};

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [RefundsController],
  providers: [
    ChatAIApiConfigProvider,
    RefundsRepositoryProvider,
    RefundsService,
  ],
  exports: [RefundsService],
})
export class RefundsModule {}
