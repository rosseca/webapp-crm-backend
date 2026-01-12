import {
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListUsersDto {
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
  email?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  email_verified?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['Google', 'Facebook', 'Apple', 'Email'])
  loginWith?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
