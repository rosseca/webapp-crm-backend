import { Injectable, Inject } from '@nestjs/common';
import {
  IRefundsRepository,
  REFUNDS_REPOSITORY,
} from './repositories/refunds.repository.interface';
import { RefundResponse } from './entities/refund.entity';
import { CreateRefundDto } from './dto/create-refund.dto';
import { GcpLoggingService, ServiceLogger } from '../common/logging';

@Injectable()
export class RefundsService {
  private readonly logger: ServiceLogger;

  constructor(
    @Inject(REFUNDS_REPOSITORY)
    private readonly refundsRepository: IRefundsRepository,
    private readonly loggingService: GcpLoggingService,
  ) {
    this.logger = this.loggingService.forService('RefundsService');
  }

  async createRefund(
    data: CreateRefundDto,
    token: string,
  ): Promise<RefundResponse> {
    await this.logger.info('createRefund', 'Processing refund request', {
      chargeId: data.chargeId,
      amount: data.amount,
      reason: data.reason,
    });

    try {
      const result = await this.refundsRepository.createRefund(data, token);
      await this.logger.info('createRefund', 'Refund processed successfully', {
        chargeId: data.chargeId,
        refundId: result.data?.refund?.id,
        status: result.data?.refund?.status,
      });
      return result;
    } catch (error) {
      await this.logger.error(
        'createRefund',
        'Failed to process refund',
        error instanceof Error ? error : new Error(String(error)),
        { chargeId: data.chargeId },
      );
      throw error;
    }
  }
}
