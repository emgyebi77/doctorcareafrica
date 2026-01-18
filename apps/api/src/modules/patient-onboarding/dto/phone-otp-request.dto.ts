import { IsString, IsUUID } from 'class-validator';

export class PhoneOtpRequestDto {
  @IsString()
  phone: string;

  @IsUUID()
  countryId: string;
}
