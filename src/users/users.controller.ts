import {
  Controller,
  Get,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ListUsersDto } from './dto/list-users.dto';
import { CurrentToken } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getList(@Query() params: ListUsersDto, @CurrentToken() token: string) {
    return this.usersService.getList(params, token);
  }

  @Get(':id')
  async getById(@Param('id') id: string, @CurrentToken() token: string) {
    const user = await this.usersService.getById(id, token);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }
}
