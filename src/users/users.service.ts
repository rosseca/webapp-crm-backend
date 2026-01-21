import { Injectable, Inject } from '@nestjs/common';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from './repositories/users.repository.interface';
import { User, PaginatedUsers } from './entities/user.entity';
import { ListUsersDto } from './dto/list-users.dto';
import { GcpLoggingService, ServiceLogger } from '../common/logging';

@Injectable()
export class UsersService {
  private readonly logger: ServiceLogger;

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly loggingService: GcpLoggingService,
  ) {
    this.logger = this.loggingService.forService('UsersService');
  }

  async getList(params: ListUsersDto, token: string): Promise<PaginatedUsers> {
    await this.logger.info('getList', 'Fetching users list', {
      page: params.page,
      limit: params.limit,
      search: params.search,
      email: params.email,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });

    try {
      const result = await this.usersRepository.getList(params, token);
      await this.logger.info('getList', 'Users list fetched successfully', {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        returnedCount: result.data.length,
      });
      return result;
    } catch (error) {
      await this.logger.error(
        'getList',
        'Failed to fetch users list',
        error instanceof Error ? error : new Error(String(error)),
        { page: params.page, limit: params.limit },
      );
      throw error;
    }
  }

  async getById(id: string, token: string): Promise<User | null> {
    await this.logger.info('getById', 'Fetching user by ID', { userId: id });

    try {
      const user = await this.usersRepository.getById(id, token);
      if (user) {
        await this.logger.info('getById', 'User found', {
          userId: id,
          userEmail: user.email,
        });
      } else {
        await this.logger.warn('getById', 'User not found', { userId: id });
      }
      return user;
    } catch (error) {
      await this.logger.error(
        'getById',
        'Failed to fetch user',
        error instanceof Error ? error : new Error(String(error)),
        { userId: id },
      );
      throw error;
    }
  }
}
