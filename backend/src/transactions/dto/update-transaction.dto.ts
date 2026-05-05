import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  MaxLength,
  Max,
} from 'class-validator';

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(9_999_999_999.99)
  amount?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
