import { IsNumber, IsPositive, Max } from 'class-validator';

export class SetBudgetDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(9_999_999_999.99)
  amount!: number;
}
