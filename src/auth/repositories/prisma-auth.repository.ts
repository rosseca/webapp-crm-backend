import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../../prisma/prisma.service';
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

/**
 * Prisma-based Auth repository implementation.
 *
 * SETUP REQUIRED:
 * 1. Install Prisma: npm install @prisma/client && npm install prisma --save-dev
 * 2. Initialize: npx prisma init
 * 3. Create PrismaService and PrismaModule
 * 4. Add User model to schema.prisma
 * 5. Uncomment the PrismaService import and constructor injection
 *
 * This is a TEMPLATE - implement the methods based on your schema.
 */
@Injectable()
export class PrismaAuthRepository implements IAuthRepository {
  constructor(
    // private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    // Example implementation:
    // const user = await this.prisma.user.create({
    //   data: {
    //     email: dto.email,
    //     password: await bcrypt.hash(dto.password, 10),
    //     firstName: dto.firstName,
    //     lastName: dto.lastName,
    //   },
    // });
    //
    // const tokens = this.generateTokens(user.id);
    // return {
    //   user: this.mapToAuth(user),
    //   ...tokens,
    // };

    throw new RepositoryException(
      'PrismaAuthRepository not implemented. See comments in file.',
      501,
    );
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    // Example implementation:
    // const user = await this.prisma.user.findUnique({
    //   where: { email: dto.email },
    // });
    //
    // if (!user || !await bcrypt.compare(dto.password, user.password)) {
    //   throw RepositoryException.unauthorized('Invalid credentials');
    // }
    //
    // const tokens = this.generateTokens(user.id);
    // return {
    //   user: this.mapToAuth(user),
    //   ...tokens,
    // };

    throw new RepositoryException(
      'PrismaAuthRepository not implemented. See comments in file.',
      501,
    );
  }

  async verifyToken(token: string): Promise<TokenVerificationResult> {
    // Example: Verify JWT token and return claims
    // try {
    //   const payload = jwt.verify(token, process.env.JWT_SECRET);
    //   return {
    //     valid: true,
    //     userId: payload.sub,
    //     email: payload.email,
    //   };
    // } catch {
    //   return { valid: false };
    // }

    throw new RepositoryException(
      'PrismaAuthRepository not implemented. See comments in file.',
      501,
    );
  }

  async refreshToken(refreshToken: string): Promise<TokenRefreshResult> {
    // Example: Verify refresh token and generate new access token
    throw new RepositoryException(
      'PrismaAuthRepository not implemented. See comments in file.',
      501,
    );
  }

  async revokeToken(token: string): Promise<boolean> {
    // Example: Add token to blacklist or delete from refresh_tokens table
    // await this.prisma.refreshToken.deleteMany({
    //   where: { token },
    // });
    return true;
  }

  async getUserById(userId: string): Promise<Auth | null> {
    // Example implementation:
    // const user = await this.prisma.user.findUnique({
    //   where: { id: userId },
    // });
    // return user ? this.mapToAuth(user) : null;

    throw new RepositoryException(
      'PrismaAuthRepository not implemented. See comments in file.',
      501,
    );
  }

  // private mapToAuth(user: PrismaUser): Auth {
  //   const auth = new Auth();
  //   auth.id = user.id;
  //   auth.email = user.email;
  //   auth.firstName = user.firstName;
  //   auth.lastName = user.lastName ?? '';
  //   auth.createdAt = user.createdAt;
  //   auth.updatedAt = user.updatedAt;
  //   return auth;
  // }

  // private generateTokens(userId: string) {
  //   const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  //   const refreshToken = jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  //   return { accessToken, refreshToken, expiresIn: 900 };
  // }
}
