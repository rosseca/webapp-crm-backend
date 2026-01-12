import {
  Controller,
  Get,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ListUsersDto } from './dto/list-users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getList(@Query() params: ListUsersDto) {
    return this.usersService.getList(params);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.usersService.getById(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }
}
