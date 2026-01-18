import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class RefundDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
