import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ITransactionsRepository,
  TRANSACTIONS_REPOSITORY,
} from './repositories/transactions.repository.interface';
import { Transaction, PaginatedTransactions } from './entities/transaction.entity';
import { ListTransactionsDto } from './dto/list-transactions.dto';

@Injectable()
export class TransactionsService {
  private apiToken: string;

  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactionsRepository: ITransactionsRepository,
    private readonly configService: ConfigService,
  ) {
    this.apiToken = this.configService.get<string>('CHATAI_API_TOKEN') || '';
  }

  async getList(params: ListTransactionsDto): Promise<PaginatedTransactions> {
    return this.transactionsRepository.getList(params, this.apiToken);
  }

  async getById(id: string): Promise<Transaction | null> {
    return this.transactionsRepository.getById(id, this.apiToken);
  }
}
