import { Auth, UserRole } from '../entities/auth.entity';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

export interface IAuthRepository {
  register(dto: RegisterDto): Promise<AuthResult>;
  registerWithRole(dto: RegisterDto, role: UserRole): Promise<AuthResult>;
  login(dto: LoginDto): Promise<AuthResult>;
  verifyToken(token: string): Promise<TokenVerificationResult>;
  refreshToken(refreshToken: string): Promise<TokenRefreshResult>;
  revokeToken(token: string): Promise<boolean>;
  getUserById(userId: string, token?: string): Promise<Auth | null>;
}

export interface AuthResult {
  user: Auth;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenVerificationResult {
  valid: boolean;
  userId?: string;
  email?: string;
  claims?: Record<string, unknown>;
  expiresAt?: Date;
}

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export const AUTH_REPOSITORY = 'AUTH_REPOSITORY';
