import {
  IsOptional,
  IsNumber,
  IsString,
  IsIn,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListTransactionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsString()
  subscription_id?: string;

  @IsOptional()
  @IsString()
  @IsIn(['payment', 'refund'])
  transaction_type?: string;

  @IsOptional()
  @IsString()
  transaction_status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['initial', 'recurring', 'upgrade'])
  payment_type?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Y', 'N'])
  is_test?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
