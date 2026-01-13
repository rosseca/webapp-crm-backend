import { Injectable, Inject } from '@nestjs/common';
import {
  ITransactionsRepository,
  TRANSACTIONS_REPOSITORY,
} from './repositories/transactions.repository.interface';
import { Transaction, PaginatedTransactions } from './entities/transaction.entity';
import { ListTransactionsDto } from './dto/list-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactionsRepository: ITransactionsRepository,
  ) {}

  async getList(
    params: ListTransactionsDto,
    token: string,
  ): Promise<PaginatedTransactions> {
    return this.transactionsRepository.getList(params, token);
  }

  async getById(id: string, token: string): Promise<Transaction | null> {
    return this.transactionsRepository.getById(id, token);
  }
}
