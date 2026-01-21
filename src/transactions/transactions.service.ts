import { Injectable, Inject } from '@nestjs/common';
import {
  ITransactionsRepository,
  TRANSACTIONS_REPOSITORY,
} from './repositories/transactions.repository.interface';
import { Transaction, PaginatedTransactions } from './entities/transaction.entity';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { GcpLoggingService, ServiceLogger } from '../common/logging';

@Injectable()
export class TransactionsService {
  private readonly logger: ServiceLogger;

  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactionsRepository: ITransactionsRepository,
    private readonly loggingService: GcpLoggingService,
  ) {
    this.logger = this.loggingService.forService('TransactionsService');
  }

  async getList(
    params: ListTransactionsDto,
    token: string,
  ): Promise<PaginatedTransactions> {
    await this.logger.info('getList', 'Fetching transactions list', {
      page: params.page,
      limit: params.limit,
      search: params.search,
      customerId: params.customer_id,
      subscriptionId: params.subscription_id,
      transactionType: params.transaction_type,
      transactionStatus: params.transaction_status,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });

    try {
      const result = await this.transactionsRepository.getList(params, token);
      await this.logger.info('getList', 'Transactions list fetched successfully', {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        returnedCount: result.data.length,
      });
      return result;
    } catch (error) {
      await this.logger.error(
        'getList',
        'Failed to fetch transactions list',
        error instanceof Error ? error : new Error(String(error)),
        { page: params.page, limit: params.limit },
      );
      throw error;
    }
  }

  async getById(id: string, token: string): Promise<Transaction | null> {
    await this.logger.info('getById', 'Fetching transaction by ID', {
      transactionId: id,
    });

    try {
      const transaction = await this.transactionsRepository.getById(id, token);
      if (transaction) {
        await this.logger.info('getById', 'Transaction found', {
          transactionId: id,
          customerId: transaction.customer_id,
          amount: transaction.amount,
          currency: transaction.currency,
        });
      } else {
        await this.logger.warn('getById', 'Transaction not found', {
          transactionId: id,
        });
      }
      return transaction;
    } catch (error) {
      await this.logger.error(
        'getById',
        'Failed to fetch transaction',
        error instanceof Error ? error : new Error(String(error)),
        { transactionId: id },
      );
      throw error;
    }
  }
}
