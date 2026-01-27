import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  BaseApiRepository,
  ApiRepositoryConfig,
} from '../../common/repositories/base-api.repository';
import { IRefundsRepository } from './refunds.repository.interface';
import { RefundResponse } from '../entities/refund.entity';
import { CreateRefundDto } from '../dto/create-refund.dto';

export const CHATAI_API_CONFIG = 'CHATAI_API_CONFIG';

@Injectable()
export class RefundsRepository
  extends BaseApiRepository
  implements IRefundsRepository
{
  private readonly logger = new Logger(RefundsRepository.name);

  constructor(
    httpService: HttpService,
    @Inject(CHATAI_API_CONFIG) config: ApiRepositoryConfig,
  ) {
    super(httpService, config);
  }

  async createRefund(
    data: CreateRefundDto,
    token: string,
  ): Promise<RefundResponse> {
    const endpoint = '/refund';
    this.logger.log(`Calling CHATAI API: ${this.config.baseUrl}${endpoint}`);

    const response = await this.post<RefundResponse>(
      endpoint,
      data,
      this.withAuth(token),
    );

    return response;
  }
}
