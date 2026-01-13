import { Injectable, Inject } from '@nestjs/common';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from './repositories/users.repository.interface';
import { User, PaginatedUsers } from './entities/user.entity';
import { ListUsersDto } from './dto/list-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async getList(params: ListUsersDto, token: string): Promise<PaginatedUsers> {
    return this.usersRepository.getList(params, token);
  }

  async getById(id: string, token: string): Promise<User | null> {
    return this.usersRepository.getById(id, token);
  }
}
