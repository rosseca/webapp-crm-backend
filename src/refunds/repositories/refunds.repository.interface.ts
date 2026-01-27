import { RefundResponse } from '../entities/refund.entity';
import { CreateRefundDto } from '../dto/create-refund.dto';

export interface IRefundsRepository {
  createRefund(data: CreateRefundDto, token: string): Promise<RefundResponse>;
}

export const REFUNDS_REPOSITORY = 'REFUNDS_REPOSITORY';
