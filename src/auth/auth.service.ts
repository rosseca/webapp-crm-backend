import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import {
  IAuthRepository,
  AuthResult,
  TokenVerificationResult,
  AUTH_REPOSITORY,
} from './repositories/auth.repository.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Auth } from './entities/auth.entity';
import { RepositoryException } from '../common/exceptions/repository.exception';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    this.logger.log(`Attempting to register user with email: ${dto.email}`);

    try {
      const result = await this.authRepository.register(dto);

      this.logger.log(`Successfully registered user: ${result.user.id}`);
      return result;
    } catch (error) {
      if (error instanceof RepositoryException && error.getStatus() === 409) {
        this.logger.warn(
          `Registration failed - email already exists: ${dto.email}`,
        );
        throw new ConflictException('Email already registered');
      }

      this.logger.error(
        `Registration failed for ${dto.email}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    this.logger.log(`Login attempt for email: ${dto.email}`);

    try {
      const result = await this.authRepository.login(dto);

      this.logger.log(`Successful login for user: ${result.user.id}`);
      return result;
    } catch (error) {
      if (error instanceof RepositoryException && error.getStatus() === 401) {
        this.logger.warn(`Failed login attempt for: ${dto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.error(
        `Login error for ${dto.email}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async verifyToken(token: string): Promise<TokenVerificationResult> {
    this.logger.debug('Verifying access token');

    const result = await this.authRepository.verifyToken(token);

    if (result.valid) {
      this.logger.debug(`Token verified for user: ${result.userId}`);
    } else {
      this.logger.debug('Token verification failed - invalid token');
    }

    return result;
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    this.logger.debug('Refreshing access token');

    try {
      const result = await this.authRepository.refreshToken(refreshToken);
      this.logger.debug('Token refreshed successfully');
      return result;
    } catch (error) {
      this.logger.warn('Token refresh failed');
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<void> {
    this.logger.log('User logout requested');

    const revoked = await this.authRepository.revokeToken(token);

    if (revoked) {
      this.logger.log('User logged out successfully');
    } else {
      this.logger.warn('Logout completed but token revocation may have failed');
    }
  }

  async getUserById(userId: string): Promise<Auth | null> {
    this.logger.debug(`Fetching user by ID: ${userId}`);

    const user = await this.authRepository.getUserById(userId);

    if (!user) {
      this.logger.debug(`User not found: ${userId}`);
    }

    return user;
  }
}
