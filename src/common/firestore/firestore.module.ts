import { Module, Global, Logger, OnModuleInit } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

export const FIRESTORE = 'FIRESTORE';

@Global()
@Module({
  providers: [
    {
      provide: FIRESTORE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Firestore => {
        const logger = new Logger('FirestoreModule');

        // Get database ID (for named databases, defaults to '(default)')
        const databaseId = configService.get<string>(
          'FIRESTORE_DATABASE_ID',
          '(default)',
        );

        // Option A: Use service account JSON file path
        const keyFilePath = configService.get<string>('FIRESTORE_KEY_FILE');
        if (keyFilePath) {
          const resolvedPath = path.resolve(process.cwd(), keyFilePath);
          if (fs.existsSync(resolvedPath)) {
            logger.log(
              `Initializing Firestore with key file: ${keyFilePath}, database: ${databaseId}`,
            );
            return new Firestore({
              keyFilename: resolvedPath,
              databaseId,
            });
          }
          logger.warn(`Key file not found: ${resolvedPath}`);
        }

        // Option B: Service account JSON via env vars (no file)
        const projectId = configService.get<string>('GCP_PROJECT_ID');
        const clientEmail = configService.get<string>('GCP_CLIENT_EMAIL');
        const privateKey = configService
          .get<string>('GCP_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n');

        if (clientEmail && privateKey && projectId) {
          logger.log(
            `Initializing Firestore with env credentials for project: ${projectId}, database: ${databaseId}`,
          );
          return new Firestore({
            projectId,
            databaseId,
            credentials: {
              client_email: clientEmail,
              private_key: privateKey,
            },
          });
        }

        // Option C: ADC (Cloud Run/GKE/Compute or local gcloud auth)
        logger.log(`Initializing Firestore with ADC, database: ${databaseId}`);
        return new Firestore({ projectId, databaseId });
      },
    },
  ],
  exports: [FIRESTORE],
})
export class FirestoreModule implements OnModuleInit {
  private readonly logger = new Logger(FirestoreModule.name);

  constructor() {}

  async onModuleInit() {
    this.logger.log('FirestoreModule initialized');
  }
}
