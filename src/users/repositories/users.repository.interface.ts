import { User, PaginatedUsers } from '../entities/user.entity';
import { ListUsersDto } from '../dto/list-users.dto';

export interface IUsersRepository {
  getList(params: ListUsersDto, token: string): Promise<PaginatedUsers>;
  getById(id: string, token: string): Promise<User | null>;
}

export const USERS_REPOSITORY = 'USERS_REPOSITORY';
