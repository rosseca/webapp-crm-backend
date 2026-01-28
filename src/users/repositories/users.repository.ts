import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  BaseApiRepository,
  ApiRepositoryConfig,
} from '../../common/repositories/base-api.repository';
import { IUsersRepository } from './users.repository.interface';
import {
  User,
  PaginatedUsers,
  UserWithTransactions,
} from '../entities/user.entity';
import { ListUsersDto } from '../dto/list-users.dto';

export const CHATAI_API_CONFIG = 'CHATAI_API_CONFIG';

@Injectable()
export class UsersRepository
  extends BaseApiRepository
  implements IUsersRepository
{
  private readonly logger = new Logger(UsersRepository.name);

  constructor(
    httpService: HttpService,
    @Inject(CHATAI_API_CONFIG) config: ApiRepositoryConfig,
  ) {
    super(httpService, config);
  }

  async getList(params: ListUsersDto, token: string): Promise<PaginatedUsers> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.email) queryParams.append('email', params.email);
    if (params.name) queryParams.append('name', params.name);
    if (params.email_verified !== undefined)
      queryParams.append('email_verified', params.email_verified.toString());
    if (params.loginWith) queryParams.append('loginWith', params.loginWith);
    if (params.user_type) queryParams.append('user_type', params.user_type);
    if (params.subscription_status)
      queryParams.append('subscription_status', params.subscription_status);
    if (params.subscription_type)
      queryParams.append('subscription_type', params.subscription_type);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `/users?${queryParams.toString()}`;
    this.logger.log(`Calling CHATAI API: ${this.config.baseUrl}${endpoint}`);
    this.logger.debug(`Token (first 50 chars): ${token.substring(0, 50)}...`);

    const response = await this.get<PaginatedUsers>(
      endpoint,
      this.withAuth(token),
    );

    return response;
  }

  async getById(id: string, token: string): Promise<User | null> {
    try {
      const response = await this.get<User>(
        `/users/${id}`,
        this.withAuth(token),
      );
      return response;
    } catch (error) {
      return null;
    }
  }

  async getUserWithTransactions(
    id: string,
    token: string,
  ): Promise<UserWithTransactions> {
    const endpoint = `/user-transactions/${id}`;
    this.logger.log(`Calling CHATAI API: ${this.config.baseUrl}${endpoint}`);

    const response = await this.get<UserWithTransactions>(
      endpoint,
      this.withAuth(token),
    );

    return response;
  }
}
