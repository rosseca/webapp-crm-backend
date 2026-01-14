import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
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
import { ConfigService } from '@nestjs/config';

interface FirebaseSignInResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered: boolean;
}

interface FirebaseLookupResponse {
  users: Array<{
    localId: string;
    email: string;
    emailVerified: boolean;
    displayName?: string;
    photoUrl?: string;
    createdAt: string;
    lastLoginAt: string;
  }>;
}

interface FirebaseTokenPayload {
  user_id?: string;
  sub?: string;
  email?: string;
  name?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

@Injectable()
export class BaasAuthRepository implements IAuthRepository {
  private readonly logger = new Logger(BaasAuthRepository.name);
  private readonly firebaseApiKey: string;
  private readonly identityToolkitUrl =
    'https://identitytoolkit.googleapis.com/v1';
  private readonly secureTokenUrl = 'https://securetoken.googleapis.com/v1';
  private readonly baasApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.firebaseApiKey = this.configService.get<string>(
      'FIREBASE_WEB_API_KEY',
      '',
    );
    this.baasApiUrl = this.configService.get<string>(
      'CHATAI_API_URL',
      'https://test.api.aichatapp.ai',
    );
  }

  async register(_dto: RegisterDto): Promise<AuthResult> {
    throw new RepositoryException(
      'Registration not supported via BAAS API. Contact admin.',
      501,
    );
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    try {
      this.logger.log(`Attempting Firebase login for: ${dto.email}`);

      // Call Firebase Identity Toolkit signInWithPassword
      const signInUrl = `${this.identityToolkitUrl}/accounts:signInWithPassword?key=${this.firebaseApiKey}`;

      const signInResponse = await firstValueFrom(
        this.httpService.post<FirebaseSignInResponse>(signInUrl, {
          email: dto.email,
          password: dto.password,
          returnSecureToken: true,
        }),
      );

      const { idToken, email, localId, expiresIn, refreshToken } =
        signInResponse.data;

      this.logger.log(`Firebase login successful for: ${email}`);

      // Get user details from lookup
      let displayName = '';
      try {
        const lookupUrl = `${this.identityToolkitUrl}/accounts:lookup?key=${this.firebaseApiKey}`;
        const lookupResponse = await firstValueFrom(
          this.httpService.post<FirebaseLookupResponse>(lookupUrl, {
            idToken,
          }),
        );

        if (lookupResponse.data.users?.[0]) {
          displayName = lookupResponse.data.users[0].displayName || '';
        }
      } catch (lookupError) {
        this.logger.warn('Failed to fetch user details from lookup');
      }

      const auth = new Auth();
      auth.id = localId;
      auth.email = email;
      auth.firstName = displayName?.split(' ')[0] || '';
      auth.lastName = displayName?.split(' ').slice(1).join(' ') || '';
      auth.createdAt = new Date();
      auth.updatedAt = new Date();

      return {
        user: auth,
        accessToken: idToken,
        refreshToken: refreshToken,
        expiresIn: parseInt(expiresIn, 10) || 3600,
      };
    } catch (error: any) {
      this.logger.error(`Firebase login failed: ${error.message}`);

      if (error.response?.data?.error) {
        const firebaseError = error.response.data.error;
        this.logger.error(`Firebase error: ${JSON.stringify(firebaseError)}`);

        if (
          firebaseError.message === 'EMAIL_NOT_FOUND' ||
          firebaseError.message === 'INVALID_PASSWORD' ||
          firebaseError.message === 'INVALID_LOGIN_CREDENTIALS'
        ) {
          throw RepositoryException.unauthorized('Invalid email or password');
        }
      }

      throw new RepositoryException('Failed to login', 500, {
        originalError: error.message,
      });
    }
  }

  async verifyToken(token: string): Promise<TokenVerificationResult> {
    try {
      const tokenPayload = this.decodeToken(token);
      const now = Math.floor(Date.now() / 1000);

      if (tokenPayload.exp && tokenPayload.exp < now) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: tokenPayload.user_id || tokenPayload.sub,
        email: tokenPayload.email,
        claims: tokenPayload,
        expiresAt: tokenPayload.exp
          ? new Date(tokenPayload.exp * 1000)
          : undefined,
      };
    } catch {
      return { valid: false };
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenRefreshResult> {
    try {
      const tokenUrl = `${this.secureTokenUrl}/token?key=${this.firebaseApiKey}`;

      const response = await firstValueFrom(
        this.httpService.post(tokenUrl, {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      );

      return {
        accessToken: response.data.id_token,
        refreshToken: response.data.refresh_token,
        expiresIn: parseInt(response.data.expires_in, 10) || 3600,
      };
    } catch (error: any) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new RepositoryException('Failed to refresh token', 401);
    }
  }

  async revokeToken(_token: string): Promise<boolean> {
    return true;
  }

  async getUserById(userId: string): Promise<Auth | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baasApiUrl}/users/${userId}`),
      );

      const userData = response.data;
      const auth = new Auth();
      auth.id = userData.id;
      auth.email = userData.email;
      auth.firstName = userData.name?.split(' ')[0] || '';
      auth.lastName = userData.name?.split(' ').slice(1).join(' ') || '';
      auth.createdAt = userData.created_at
        ? new Date(userData.created_at)
        : new Date();
      auth.updatedAt = userData.updated_at
        ? new Date(userData.updated_at)
        : new Date();

      return auth;
    } catch {
      return null;
    }
  }

  private decodeToken(token: string): FirebaseTokenPayload {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = parts[1];
      const decoded = Buffer.from(payload, 'base64').toString('utf-8');
      return JSON.parse(decoded) as FirebaseTokenPayload;
    } catch {
      throw new RepositoryException('Invalid token format', 401);
    }
  }
}
