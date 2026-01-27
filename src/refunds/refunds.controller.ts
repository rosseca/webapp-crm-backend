import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { FirebaseTokenService } from '../common/services/firebase-token.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Refunds')
@ApiBearerAuth()
@Controller('refunds')
@Public()
export class RefundsController {
  constructor(
    private readonly refundsService: RefundsService,
    private readonly firebaseTokenService: FirebaseTokenService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Process a Stripe refund' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async createRefund(@Body() createRefundDto: CreateRefundDto) {
    const token = await this.firebaseTokenService.getToken();
    return this.refundsService.createRefund(createRefundDto, token);
  }
}
