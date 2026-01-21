import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import {
  FirebaseTokenService,
  FIREBASE_TOKEN_SERVICE,
} from './firebase-token.service';
import { FirestoreModule } from '../firestore/firestore.module';

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
    FirestoreModule,
  ],
  providers: [
    {
      provide: FIREBASE_TOKEN_SERVICE,
      useClass: FirebaseTokenService,
    },
    FirebaseTokenService,
  ],
  exports: [FIREBASE_TOKEN_SERVICE, FirebaseTokenService],
})
export class FirebaseTokenModule {}
