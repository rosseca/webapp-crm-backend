import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import {
  IAuthRepository,
  AuthResult,
  TokenVerificationResult,
  TokenRefreshResult,
} from './auth.repository.interface';
import { Auth, UserRole } from '../entities/auth.entity';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RepositoryException } from '../../common/exceptions/repository.exception';

@Injectable()
export class FirebaseAuthRepository implements IAuthRepository, OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (!admin.apps.length) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.configService
            .get<string>('FIREBASE_PRIVATE_KEY')
            ?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      this.firebaseApp = admin.app();
    }
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    try {
      const userRecord = await admin.auth().createUser({
        email: dto.email,
        password: dto.password,
        displayName: `${dto.firstName} ${dto.lastName}`,
      });

      const customToken = await admin.auth().createCustomToken(userRecord.uid);

      return {
        user: this.mapFirebaseUserToAuth(userRecord),
        accessToken: customToken,
        refreshToken: '',
        expiresIn: 3600,
      };
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  async registerWithRole(dto: RegisterDto, role: UserRole): Promise<AuthResult> {
    // Firebase Auth doesn't support custom roles natively
    // For now, delegate to register and set custom claims with role
    try {
      const userRecord = await admin.auth().createUser({
        email: dto.email,
        password: dto.password,
        displayName: `${dto.firstName} ${dto.lastName}`,
      });

      // Set custom claims with role
      await admin.auth().setCustomUserClaims(userRecord.uid, { role });

      const customToken = await admin.auth().createCustomToken(userRecord.uid);
      const auth = this.mapFirebaseUserToAuth(userRecord);
      auth.role = role;

      return {
        user: auth,
        accessToken: customToken,
        refreshToken: '',
        expiresIn: 3600,
      };
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    throw new RepositoryException(
      'Direct login not supported. Use client-side Firebase Auth SDK.',
      400,
      { hint: 'Use verifyToken() with Firebase ID token from client' },
    );
  }

  async verifyToken(token: string): Promise<TokenVerificationResult> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      return {
        valid: true,
        userId: decodedToken.uid,
        email: decodedToken.email,
        claims: decodedToken,
        expiresAt: new Date(decodedToken.exp * 1000),
      };
    } catch (error) {
      if (
        this.isFirebaseAuthError(error) &&
        [
          'auth/id-token-expired',
          'auth/argument-error',
          'auth/invalid-id-token',
        ].includes(error.code)
      ) {
        return { valid: false };
      }
      throw this.handleFirebaseError(error);
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenRefreshResult> {
    throw new RepositoryException(
      'Token refresh should be handled client-side with Firebase SDK',
      400,
    );
  }

  async revokeToken(userId: string): Promise<boolean> {
    try {
      await admin.auth().revokeRefreshTokens(userId);
      return true;
    } catch {
      return false;
    }
  }

  async getUserById(userId: string): Promise<Auth | null> {
    try {
      const userRecord = await admin.auth().getUser(userId);
      return this.mapFirebaseUserToAuth(userRecord);
    } catch (error) {
      if (
        this.isFirebaseAuthError(error) &&
        error.code === 'auth/user-not-found'
      ) {
        return null;
      }
      throw this.handleFirebaseError(error);
    }
  }

  async getUserByEmail(email: string): Promise<Auth | null> {
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      return this.mapFirebaseUserToAuth(userRecord);
    } catch (error) {
      if (
        this.isFirebaseAuthError(error) &&
        error.code === 'auth/user-not-found'
      ) {
        return null;
      }
      throw this.handleFirebaseError(error);
    }
  }

  private mapFirebaseUserToAuth(userRecord: admin.auth.UserRecord): Auth {
    const auth = new Auth();
    auth.id = userRecord.uid;
    auth.email = userRecord.email || '';

    const nameParts = (userRecord.displayName || '').split(' ');
    auth.firstName = nameParts[0] || '';
    auth.lastName = nameParts.slice(1).join(' ') || '';
    auth.role = (userRecord.customClaims?.role as UserRole) || 'admin';

    auth.createdAt = new Date(userRecord.metadata.creationTime);
    auth.updatedAt = new Date(
      userRecord.metadata.lastSignInTime || userRecord.metadata.creationTime,
    );

    return auth;
  }

  private handleFirebaseError(error: unknown): RepositoryException {
    if (this.isFirebaseAuthError(error)) {
      const statusMap: Record<string, number> = {
        'auth/user-not-found': 404,
        'auth/email-already-exists': 409,
        'auth/invalid-email': 400,
        'auth/weak-password': 400,
        'auth/id-token-expired': 401,
        'auth/invalid-id-token': 401,
      };

      const status = statusMap[error.code] || 500;
      return new RepositoryException(error.message, status, {
        firebaseCode: error.code,
      });
    }

    return new RepositoryException('Firebase operation failed', 500, {
      originalError: (error as Error).message,
    });
  }

  private isFirebaseAuthError(error: unknown): error is admin.FirebaseError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as Record<string, unknown>).code === 'string'
    );
  }
}
