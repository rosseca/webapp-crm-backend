import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 10000),
        maxRedirects: 5,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }),
    }),
  ],
  exports: [HttpModule],
})
export class HttpClientModule {}
