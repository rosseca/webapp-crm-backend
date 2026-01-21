import {
  Controller,
  Get,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ListUsersDto } from './dto/list-users.dto';
import { FirebaseTokenService } from '../common/services/firebase-token.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@Public()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly firebaseTokenService: FirebaseTokenService,
  ) {}

  @Get()
  async getList(@Query() params: ListUsersDto) {
    const token = await this.firebaseTokenService.getToken();
    this.logger.log(`Got token (length: ${token?.length}, first 50 chars: ${token?.substring(0, 50)}...)`);
    return this.usersService.getList(params, token);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const token = await this.firebaseTokenService.getToken();
    const user = await this.usersService.getById(id, token);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }
}
