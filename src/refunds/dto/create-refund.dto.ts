import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRefundDto {
  @ApiProperty({
    description: 'The Stripe charge ID to refund (starts with ch_)',
    example: 'ch_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  chargeId: string;

  @ApiPropertyOptional({
    description: 'Amount to refund in cents. If not provided, full refund is processed.',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Reason for the refund',
    enum: ['duplicate', 'fraudulent', 'requested_by_customer'],
    example: 'requested_by_customer',
  })
  @IsOptional()
  @IsIn(['duplicate', 'fraudulent', 'requested_by_customer'])
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}
