import { IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCheckoutDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number;

  @IsString()
  @MaxLength(10)
  currency: string;

  @IsIn(['STRIPE', 'MOMO'])
  provider: 'STRIPE' | 'MOMO';

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsString()
  momoPhone?: string;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  callbackUrl?: string;
}
