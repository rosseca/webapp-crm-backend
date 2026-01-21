import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GcpLoggingService } from './gcp-logging.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GcpLoggingService],
  exports: [GcpLoggingService],
})
export class LoggingModule {}
