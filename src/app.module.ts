import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HttpClientModule } from './common/http/http-client.module';
import { FirebaseTokenModule } from './common/services/firebase-token.module';
import { LoggingModule } from './common/logging';
import { UsersModule } from './users/users.module';
import { TransactionsModule } from './transactions/transactions.module';
import { RefundsModule } from './refunds/refunds.module';
import { NotesModule } from './notes/notes.module';
import { AuthGuard } from './common/guards/auth.guard';
import { AuthorizationModule } from './common/authorization/authorization.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // In production (Cloud Run), env vars come from the container, not files
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? undefined
          : ['.env.local', '.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    LoggingModule,
    HttpClientModule,
    FirebaseTokenModule,
    AuthorizationModule,
    AuthModule,
    UsersModule,
    TransactionsModule,
    RefundsModule,
    NotesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
