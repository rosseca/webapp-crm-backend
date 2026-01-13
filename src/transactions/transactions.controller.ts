import {
  Controller,
  Get,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { CurrentToken } from '../common/decorators/current-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getList(
    @Query() params: ListTransactionsDto,
    @CurrentToken() token: string,
  ) {
    return this.transactionsService.getList(params, token);
  }

  @Get(':id')
  async getById(@Param('id') id: string, @CurrentToken() token: string) {
    const transaction = await this.transactionsService.getById(id, token);
    if (!transaction) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }
    return transaction;
  }
}
