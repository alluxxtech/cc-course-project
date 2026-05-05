import {
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryTransactionsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(['this_month', 'last_month'])
  preset?: 'this_month' | 'last_month';

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountMin?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountMax?: number;
}
