import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from './repositories/users.repository.interface';
import { User, PaginatedUsers } from './entities/user.entity';
import { ListUsersDto } from './dto/list-users.dto';

@Injectable()
export class UsersService {
  private apiToken: string;

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly configService: ConfigService,
  ) {
    this.apiToken = this.configService.get<string>('CHATAI_API_TOKEN') || '';
  }

  async getList(params: ListUsersDto): Promise<PaginatedUsers> {
    return this.usersRepository.getList(params, this.apiToken);
  }

  async getById(id: string): Promise<User | null> {
    return this.usersRepository.getById(id, this.apiToken);
  }
}
