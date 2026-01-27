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
import { Auth, UserRole } from '../entities/auth.entity';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RepositoryException } from '../../common/exceptions/repository.exception';

export const AUTH_API_CONFIG = 'AUTH_API_CONFIG';

interface AuthApiResponse {
  user: UserApiResponse;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface UserApiResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

interface TokenVerifyApiResponse {
  valid: boolean;
  userId?: string;
  email?: string;
  claims?: Record<string, unknown>;
  expiresAt?: string;
}

interface TokenRefreshApiResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

@Injectable()
export class AuthRepository
  extends BaseApiRepository
  implements IAuthRepository
{
  constructor(
    httpService: HttpService,
    @Inject(AUTH_API_CONFIG) config: ApiRepositoryConfig,
  ) {
    super(httpService, config);
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    try {
      const response = await this.post<AuthApiResponse>('/auth/register', {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });

      return this.mapToAuthResult(response);
    } catch (error) {
      if (error instanceof RepositoryException) {
        throw error;
      }
      throw new RepositoryException('Failed to register user', 500, {
        originalError: (error as Error).message,
      });
    }
  }

  async registerWithRole(dto: RegisterDto, role: UserRole): Promise<AuthResult> {
    try {
      const response = await this.post<AuthApiResponse>('/auth/invite', {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role,
      });

      return this.mapToAuthResult(response);
    } catch (error) {
      if (error instanceof RepositoryException) {
        throw error;
      }
      throw new RepositoryException('Failed to register user with role', 500, {
        originalError: (error as Error).message,
      });
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    try {
      const response = await this.post<AuthApiResponse>('/auth/login', {
        email: dto.email,
        password: dto.password,
      });

      return this.mapToAuthResult(response);
    } catch (error) {
      if (error instanceof RepositoryException && error.getStatus() === 401) {
        throw RepositoryException.unauthorized('Invalid email or password');
      }
      throw error;
    }
  }

  async verifyToken(token: string): Promise<TokenVerificationResult> {
    try {
      const response = await this.post<TokenVerifyApiResponse>('/auth/verify', {
        token,
      });

      return {
        valid: response.valid,
        userId: response.userId,
        email: response.email,
        claims: response.claims,
        expiresAt: response.expiresAt ? new Date(response.expiresAt) : undefined,
      };
    } catch (error) {
      if (error instanceof RepositoryException && error.getStatus() === 401) {
        return { valid: false };
      }
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenRefreshResult> {
    const response = await this.post<TokenRefreshApiResponse>('/auth/refresh', {
      refreshToken,
    });

    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresIn: response.expiresIn,
    };
  }

  async revokeToken(token: string): Promise<boolean> {
    try {
      await this.post('/auth/revoke', { token });
      return true;
    } catch {
      return false;
    }
  }

  async getUserById(userId: string): Promise<Auth | null> {
    try {
      const response = await this.get<UserApiResponse>(`/users/${userId}`);
      return this.mapToAuthEntity(response);
    } catch (error) {
      if (error instanceof RepositoryException && error.getStatus() === 404) {
        return null;
      }
      throw error;
    }
  }

  private mapToAuthResult(response: AuthApiResponse): AuthResult {
    return {
      user: this.mapToAuthEntity(response.user),
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresIn: response.expiresIn,
    };
  }

  private mapToAuthEntity(userData: UserApiResponse): Auth {
    const auth = new Auth();
    auth.id = userData.id;
    auth.email = userData.email;
    auth.firstName = userData.firstName;
    auth.lastName = userData.lastName;
    auth.role = (userData.role as UserRole) || 'admin';
    auth.createdAt = new Date(userData.createdAt);
    auth.updatedAt = new Date(userData.updatedAt);
    return auth;
  }
}
