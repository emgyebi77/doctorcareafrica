import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class StripeWebhookDto {
  @IsString()
  @MaxLength(200)
  eventId: string;

  @IsString()
  @MaxLength(200)
  eventType: string;

  @IsString()
  @MaxLength(200)
  paymentReference: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  amount?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
