import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Body() dto: VerifyTokenDto) {
    const result = await this.authService.verifyToken(dto.token);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    const result = await this.authService.refreshToken(refreshToken);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }
    await this.authService.logout(token);
  }

  @Get('user/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.authService.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
