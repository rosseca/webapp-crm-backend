import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  IAuthRepository,
  AuthResult,
  TokenVerificationResult,
  TokenRefreshResult,
} from './auth.repository.interface';
import { Auth } from '../entities/auth.entity';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RepositoryException } from '../../common/exceptions/repository.exception';

interface FirestoreUserDoc {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface FirestoreTokenDoc {
  userId: string;
  refreshToken: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

interface TokenPayload {
  userId: string;
  email: string;
  exp: number;
  iat: number;
  type: 'access' | 'refresh';
}

export class FirestoreAuthRepository implements IAuthRepository {
  private readonly logger = new Logger(FirestoreAuthRepository.name);
  private usersCollection;
  private tokensCollection;
  private readonly jwtSecret: string;
  private readonly accessTokenExpiresIn: number;
  private readonly refreshTokenExpiresIn: number;
  private initialized = false;

  constructor(
    private readonly firestore: Firestore,
    private readonly configService: ConfigService,
  ) {
    this.usersCollection = this.firestore.collection('auth_users');
    this.tokensCollection = this.firestore.collection('auth_tokens');
    this.jwtSecret = this.configService.get<string>(
      'JWT_SECRET',
      'your-super-secret-jwt-key-change-in-production',
    );
    this.accessTokenExpiresIn = this.configService.get<number>(
      'JWT_ACCESS_EXPIRES_IN',
      3600,
    ); // 1 hour
    this.refreshTokenExpiresIn = this.configService.get<number>(
      'JWT_REFRESH_EXPIRES_IN',
      604800,
    ); // 7 days

    // Seed default user on construction
    this.seedDefaultUser().catch((err) => {
      this.logger.error(`Failed to seed default user: ${err.message}`);
    });
  }

  private async seedDefaultUser() {
    const defaultEmail = this.configService.get<string>('DEFAULT_USER_EMAIL');
    const defaultPassword = this.configService.get<string>(
      'DEFAULT_USER_PASSWORD',
    );

    if (!defaultEmail || !defaultPassword) {
      this.logger.log('No default user configured, skipping seed');
      return;
    }

    try {
      // Check if user already exists
      const existingUser = await this.usersCollection
        .where('email', '==', defaultEmail)
        .limit(1)
        .get();

      if (!existingUser.empty) {
        this.logger.log(`Default user already exists: ${defaultEmail}`);
        return;
      }

      // Create default user
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      const now = Timestamp.now();

      const userData: FirestoreUserDoc = {
        email: defaultEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        createdAt: now,
        updatedAt: now,
      };

      const docRef = this.usersCollection.doc();
      await docRef.set(userData);

      this.logger.log(`Default user created: ${defaultEmail}`);
    } catch (error) {
      // Check for Firestore NOT_FOUND error (database not created)
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        this.logger.warn(
          'Firestore database not found. Please create it at: https://console.firebase.google.com/project/webapps-crm-dev/firestore',
        );
      } else {
        this.logger.error(`Failed to seed default user: ${error.message}`);
      }
    }
  }

  private isLeadtechEmail(email: string): boolean {
    const domain = email.toLowerCase().split('@')[1];
    return domain ? domain.includes('leadtech') : false;
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    try {
      this.logger.log(`Registering new user: ${dto.email}`);

      // Validate email domain - only leadtech emails allowed
      if (!this.isLeadtechEmail(dto.email)) {
        this.logger.warn(`Registration rejected - non-leadtech email: ${dto.email}`);
        throw RepositoryException.validationError(
          'Only @leadtech email addresses are allowed to register',
        );
      }

      // Check if email already exists
      const existingUser = await this.usersCollection
        .where('email', '==', dto.email.toLowerCase())
        .limit(1)
        .get();

      if (!existingUser.empty) {
        throw RepositoryException.validationError('Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const now = Timestamp.now();

      // Create user document
      const userData: FirestoreUserDoc = {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName || '',
        createdAt: now,
        updatedAt: now,
      };

      const docRef = this.usersCollection.doc();
      await docRef.set(userData);

      const auth = new Auth();
      auth.id = docRef.id;
      auth.email = userData.email;
      auth.firstName = userData.firstName;
      auth.lastName = userData.lastName;
      auth.createdAt = now.toDate();
      auth.updatedAt = now.toDate();

      // Generate tokens
      const accessToken = this.generateToken(auth.id, auth.email, 'access');
      const refreshToken = this.generateToken(auth.id, auth.email, 'refresh');

      // Store refresh token
      await this.storeRefreshToken(auth.id, refreshToken);

      this.logger.log(`User registered successfully: ${dto.email}`);

      return {
        user: auth,
        accessToken,
        refreshToken,
        expiresIn: this.accessTokenExpiresIn,
      };
    } catch (error) {
      if (error instanceof RepositoryException) {
        throw error;
      }
      this.logger.error(`Registration failed: ${error.message}`);

      // Check for Firestore NOT_FOUND error (database not created)
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        throw new RepositoryException(
          'Firestore database not found. Please create the Firestore database in Firebase Console: https://console.firebase.google.com/project/webapps-crm-dev/firestore',
          503,
          { originalError: error.message },
        );
      }

      throw new RepositoryException('Failed to register user', 500, {
        originalError: error.message,
      });
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    try {
      this.logger.log(`Attempting login for: ${dto.email}`);

      // Find user by email
      const userQuery = await this.usersCollection
        .where('email', '==', dto.email.toLowerCase())
        .limit(1)
        .get();

      if (userQuery.empty) {
        throw RepositoryException.unauthorized('Invalid email or password');
      }

      const userDoc = userQuery.docs[0];
      const userData = userDoc.data() as FirestoreUserDoc;

      // Verify password
      const isValidPassword = await bcrypt.compare(
        dto.password,
        userData.passwordHash,
      );
      if (!isValidPassword) {
        throw RepositoryException.unauthorized('Invalid email or password');
      }

      const auth = new Auth();
      auth.id = userDoc.id;
      auth.email = userData.email;
      auth.firstName = userData.firstName;
      auth.lastName = userData.lastName;
      auth.createdAt = userData.createdAt.toDate();
      auth.updatedAt = userData.updatedAt.toDate();

      // Generate tokens
      const accessToken = this.generateToken(auth.id, auth.email, 'access');
      const refreshToken = this.generateToken(auth.id, auth.email, 'refresh');

      // Store refresh token
      await this.storeRefreshToken(auth.id, refreshToken);

      this.logger.log(`Login successful for: ${dto.email}`);

      return {
        user: auth,
        accessToken,
        refreshToken,
        expiresIn: this.accessTokenExpiresIn,
      };
    } catch (error) {
      if (error instanceof RepositoryException) {
        throw error;
      }
      this.logger.error(`Login failed: ${error.message}`);

      // Check for Firestore NOT_FOUND error (database not created)
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        throw new RepositoryException(
          'Firestore database not found. Please create the Firestore database in Firebase Console.',
          503,
          { originalError: error.message },
        );
      }

      throw new RepositoryException('Failed to login', 500, {
        originalError: error.message,
      });
    }
  }

  async verifyToken(token: string): Promise<TokenVerificationResult> {
    try {
      const payload = this.decodeAndVerifyToken(token);

      if (!payload || payload.type !== 'access') {
        return { valid: false };
      }

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: payload.userId,
        email: payload.email,
        claims: payload as unknown as Record<string, unknown>,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
      };
    } catch {
      return { valid: false };
    }
  }

  async refreshToken(refreshTokenValue: string): Promise<TokenRefreshResult> {
    try {
      const payload = this.decodeAndVerifyToken(refreshTokenValue);

      if (!payload || payload.type !== 'refresh') {
        throw RepositoryException.unauthorized('Invalid refresh token');
      }

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw RepositoryException.unauthorized('Refresh token expired');
      }

      // Verify token exists in database
      const tokenQuery = await this.tokensCollection
        .where('userId', '==', payload.userId)
        .where('refreshToken', '==', refreshTokenValue)
        .limit(1)
        .get();

      if (tokenQuery.empty) {
        throw RepositoryException.unauthorized('Refresh token not found');
      }

      // Generate new tokens
      const newAccessToken = this.generateToken(
        payload.userId,
        payload.email,
        'access',
      );
      const newRefreshToken = this.generateToken(
        payload.userId,
        payload.email,
        'refresh',
      );

      // Delete old refresh token and store new one
      await tokenQuery.docs[0].ref.delete();
      await this.storeRefreshToken(payload.userId, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.accessTokenExpiresIn,
      };
    } catch (error) {
      if (error instanceof RepositoryException) {
        throw error;
      }
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new RepositoryException('Failed to refresh token', 401);
    }
  }

  async revokeToken(token: string): Promise<boolean> {
    try {
      const payload = this.decodeAndVerifyToken(token);
      if (!payload) {
        return false;
      }

      // Delete all refresh tokens for this user
      const tokenQuery = await this.tokensCollection
        .where('userId', '==', payload.userId)
        .get();

      const batch = this.firestore.batch();
      tokenQuery.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      return true;
    } catch {
      return false;
    }
  }

  async getUserById(userId: string): Promise<Auth | null> {
    try {
      const userDoc = await this.usersCollection.doc(userId).get();

      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data() as FirestoreUserDoc;
      const auth = new Auth();
      auth.id = userDoc.id;
      auth.email = userData.email;
      auth.firstName = userData.firstName;
      auth.lastName = userData.lastName;
      auth.createdAt = userData.createdAt.toDate();
      auth.updatedAt = userData.updatedAt.toDate();

      return auth;
    } catch {
      return null;
    }
  }

  private generateToken(
    userId: string,
    email: string,
    type: 'access' | 'refresh',
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn =
      type === 'access'
        ? this.accessTokenExpiresIn
        : this.refreshTokenExpiresIn;

    const payload: TokenPayload = {
      userId,
      email,
      iat: now,
      exp: now + expiresIn,
      type,
    };

    // Simple JWT implementation (header.payload.signature)
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    return `${headerB64}.${payloadB64}.${signature}`;
  }

  private decodeAndVerifyToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [headerB64, payloadB64, signature] = parts;

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.jwtSecret)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf-8'),
      );
      return payload as TokenPayload;
    } catch {
      return null;
    }
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const expiresAt = Timestamp.fromMillis(
      Date.now() + this.refreshTokenExpiresIn * 1000,
    );

    const tokenData: FirestoreTokenDoc = {
      userId,
      refreshToken,
      expiresAt,
      createdAt: Timestamp.now(),
    };

    await this.tokensCollection.doc().set(tokenData);
  }
}
