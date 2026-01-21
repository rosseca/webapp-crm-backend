import {
  Injectable,
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
import { GcpLoggingService, ServiceLogger } from '../common/logging';

@Injectable()
export class AuthService {
  private readonly logger: ServiceLogger;

  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly loggingService: GcpLoggingService,
  ) {
    this.logger = this.loggingService.forService('AuthService');
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    await this.logger.info('register', `Attempting to register user`, {
      userEmail: dto.email,
    });

    try {
      const result = await this.authRepository.register(dto);

      await this.logger.info('register', `Successfully registered user`, {
        userId: result.user.id,
        userEmail: result.user.email,
      });
      return result;
    } catch (error) {
      if (error instanceof RepositoryException && error.getStatus() === 409) {
        await this.logger.warn('register', `Registration failed - email already exists`, {
          userEmail: dto.email,
        });
        throw new ConflictException('Email already registered');
      }

      await this.logger.error(
        'register',
        `Registration failed`,
        error instanceof Error ? error : new Error(String(error)),
        { userEmail: dto.email },
      );
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    await this.logger.info('login', `Login attempt`, { userEmail: dto.email });

    try {
      const result = await this.authRepository.login(dto);

      await this.logger.info('login', `Successful login`, {
        userId: result.user.id,
        userEmail: result.user.email,
      });
      return result;
    } catch (error) {
      if (error instanceof RepositoryException && error.getStatus() === 401) {
        await this.logger.warn('login', `Failed login attempt - invalid credentials`, {
          userEmail: dto.email,
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.logger.error(
        'login',
        `Login error`,
        error instanceof Error ? error : new Error(String(error)),
        { userEmail: dto.email },
      );
      throw error;
    }
  }

  async verifyToken(token: string): Promise<TokenVerificationResult> {
    const result = await this.authRepository.verifyToken(token);

    if (result.valid) {
      await this.logger.debug('verifyToken', `Token verified successfully`, {
        userId: result.userId,
        userEmail: result.email,
      });
    } else {
      await this.logger.debug('verifyToken', `Token verification failed - invalid token`);
    }

    return result;
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    await this.logger.debug('refreshToken', `Refreshing access token`);

    try {
      const result = await this.authRepository.refreshToken(refreshToken);
      await this.logger.info('refreshToken', `Token refreshed successfully`);
      return result;
    } catch (error) {
      await this.logger.warn('refreshToken', `Token refresh failed`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<void> {
    await this.logger.info('logout', `User logout requested`);

    const revoked = await this.authRepository.revokeToken(token);

    if (revoked) {
      await this.logger.info('logout', `User logged out successfully`);
    } else {
      await this.logger.warn('logout', `Logout completed but token revocation may have failed`);
    }
  }

  async getUserById(userId: string): Promise<Auth | null> {
    await this.logger.debug('getUserById', `Fetching user by ID`, { userId });

    const user = await this.authRepository.getUserById(userId);

    if (!user) {
      await this.logger.debug('getUserById', `User not found`, { userId });
    }

    return user;
  }
}
