import { Transaction, PaginatedTransactions } from '../entities/transaction.entity';
import { ListTransactionsDto } from '../dto/list-transactions.dto';

export interface ITransactionsRepository {
  getList(params: ListTransactionsDto, token: string): Promise<PaginatedTransactions>;
  getById(id: string, token: string): Promise<Transaction | null>;
}

export const TRANSACTIONS_REPOSITORY = 'TRANSACTIONS_REPOSITORY';
