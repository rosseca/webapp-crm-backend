import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  BaseApiRepository,
  ApiRepositoryConfig,
} from '../../common/repositories/base-api.repository';
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

export const BAAS_API_CONFIG = 'BAAS_API_CONFIG';

interface BaasAuthResponse {
  token: string;
}

interface BaasUserResponse {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
  loginWith: string;
  company_name?: string;
  created_at: string | null;
  updated_at: string | null;
}

@Injectable()
export class BaasAuthRepository
  extends BaseApiRepository
  implements IAuthRepository
{
  constructor(
    httpService: HttpService,
    @Inject(BAAS_API_CONFIG) config: ApiRepositoryConfig,
  ) {
    super(httpService, config);
  }

  async register(_dto: RegisterDto): Promise<AuthResult> {
    // BAAS user creation requires ADMIN role, so registration
    // should be handled differently (e.g., via admin panel)
    throw new RepositoryException(
      'Registration not supported via BAAS API. Contact admin.',
      501,
    );
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    try {
      // Call BAAS /api/auth with username (email) and password
      const response = await this.post<BaasAuthResponse>('/auth', {
        username: dto.email,
        password: dto.password,
      });

      // Decode the Firebase token to get user info
      const tokenPayload = this.decodeToken(response.token);

      const auth = new Auth();
      auth.id = tokenPayload.user_id || tokenPayload.sub || '';
      auth.email = tokenPayload.email || dto.email;
      auth.firstName = tokenPayload.name?.split(' ')[0] || '';
      auth.lastName = tokenPayload.name?.split(' ').slice(1).join(' ') || '';
      auth.createdAt = new Date();
      auth.updatedAt = new Date();

      return {
        user: auth,
        accessToken: response.token,
        refreshToken: response.token, // Firebase tokens don't have separate refresh tokens in this flow
        expiresIn: tokenPayload.exp
          ? tokenPayload.exp - Math.floor(Date.now() / 1000)
          : 3600,
      };
    } catch (error) {
      if (error instanceof RepositoryException) {
        if (error.getStatus() === 401) {
          throw RepositoryException.unauthorized('Invalid email or password');
        }
        throw error;
      }
      throw new RepositoryException('Failed to login', 500, {
        originalError: (error as Error).message,
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
        expiresAt: tokenPayload.exp ? new Date(tokenPayload.exp * 1000) : undefined,
      };
    } catch {
      return { valid: false };
    }
  }

  async refreshToken(_refreshToken: string): Promise<TokenRefreshResult> {
    // Firebase token refresh should be handled on the client side
    throw new RepositoryException(
      'Token refresh should be handled on client side with Firebase SDK',
      501,
    );
  }

  async revokeToken(_token: string): Promise<boolean> {
    // Token revocation would require Firebase Admin SDK
    // For now, we just return true (client should clear their token)
    return true;
  }

  async getUserById(userId: string): Promise<Auth | null> {
    try {
      // We need a valid token to fetch user info
      // This would typically be called with the current user's token
      const response = await this.get<BaasUserResponse>(`/users/${userId}`);

      const auth = new Auth();
      auth.id = response.id;
      auth.email = response.email;
      auth.firstName = response.name?.split(' ')[0] || '';
      auth.lastName = response.name?.split(' ').slice(1).join(' ') || '';
      auth.createdAt = response.created_at
        ? new Date(response.created_at)
        : new Date();
      auth.updatedAt = response.updated_at
        ? new Date(response.updated_at)
        : new Date();

      return auth;
    } catch (error) {
      if (error instanceof RepositoryException && error.getStatus() === 404) {
        return null;
      }
      throw error;
    }
  }

  private decodeToken(token: string): Record<string, unknown> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = parts[1];
      const decoded = Buffer.from(payload, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      throw new RepositoryException('Invalid token format', 401);
    }
  }
}
