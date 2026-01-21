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
import { FirebaseTokenService } from '../common/services/firebase-token.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@Public()
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly firebaseTokenService: FirebaseTokenService,
  ) {}

  @Get()
  async getList(@Query() params: ListTransactionsDto) {
    const token = await this.firebaseTokenService.getToken();
    return this.transactionsService.getList(params, token);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const token = await this.firebaseTokenService.getToken();
    const transaction = await this.transactionsService.getById(id, token);
    if (!transaction) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }
    return transaction;
  }
}
