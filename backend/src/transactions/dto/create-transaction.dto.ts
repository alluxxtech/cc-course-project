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

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(9_999_999_999.99)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency!: string;

  @IsDateString()
  date!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
