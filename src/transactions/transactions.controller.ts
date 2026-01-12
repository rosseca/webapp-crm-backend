import {
  Controller,
  Get,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ListTransactionsDto } from './dto/list-transactions.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getList(@Query() params: ListTransactionsDto) {
    return this.transactionsService.getList(params);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const transaction = await this.transactionsService.getById(id);
    if (!transaction) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }
    return transaction;
  }
}
