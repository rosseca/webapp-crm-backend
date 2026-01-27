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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { AbilitiesGuard } from '../common/guards/abilities.guard';
import { CheckAbilities } from '../common/decorators/check-abilities.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
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

  @Public()
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

  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Body() dto: VerifyTokenDto) {
    const result = await this.authService.verifyToken(dto.token);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    const result = await this.authService.refreshToken(refreshToken);
    return result;
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }
    await this.authService.logout(token);
  }

  @ApiBearerAuth()
  @Get('user/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.authService.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a new user (requires admin role)' })
  @Post('invite')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AbilitiesGuard)
  @CheckAbilities({ action: 'create', subject: 'User' })
  async inviteUser(
    @Body() dto: InviteUserDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    const user = await this.authService.inviteUser(dto, {
      userId: currentUser.id,
      email: currentUser.email,
    });
    return {
      message: 'User invited successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
