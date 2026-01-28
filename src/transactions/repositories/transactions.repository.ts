import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  BaseApiRepository,
  ApiRepositoryConfig,
} from '../../common/repositories/base-api.repository';
import { ITransactionsRepository } from './transactions.repository.interface';
import { Transaction, PaginatedTransactions } from '../entities/transaction.entity';
import { ListTransactionsDto } from '../dto/list-transactions.dto';

export const CHATAI_API_CONFIG = 'CHATAI_API_CONFIG';

@Injectable()
export class TransactionsRepository
  extends BaseApiRepository
  implements ITransactionsRepository
{
  constructor(
    httpService: HttpService,
    @Inject(CHATAI_API_CONFIG) config: ApiRepositoryConfig,
  ) {
    super(httpService, config);
  }

  async getList(
    params: ListTransactionsDto,
    token: string,
  ): Promise<PaginatedTransactions> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.email) queryParams.append('email', params.email);
    if (params.id_transaction)
      queryParams.append('id_transaction', params.id_transaction);
    if (params.order_number)
      queryParams.append('order_number', params.order_number);
    if (params.bin) queryParams.append('bin', params.bin);
    if (params.last_4) queryParams.append('last_4', params.last_4);
    if (params.card_holder_name)
      queryParams.append('card_holder_name', params.card_holder_name);
    if (params.customer_id) queryParams.append('customer_id', params.customer_id);
    if (params.subscription_id)
      queryParams.append('subscription_id', params.subscription_id);
    if (params.transaction_type)
      queryParams.append('transaction_type', params.transaction_type);
    if (params.transaction_status)
      queryParams.append('transaction_status', params.transaction_status);
    if (params.payment_type)
      queryParams.append('payment_type', params.payment_type);
    if (params.currency) queryParams.append('currency', params.currency);
    if (params.is_test) queryParams.append('is_test', params.is_test);
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `/transactions?${queryParams.toString()}`;
    const response = await this.get<PaginatedTransactions>(
      endpoint,
      this.withAuth(token),
    );

    return response;
  }

  async getById(id: string, token: string): Promise<Transaction | null> {
    try {
      const response = await this.get<Transaction>(
        `/transactions/${id}`,
        this.withAuth(token),
      );
      return response;
    } catch (error) {
      return null;
    }
  }
}
