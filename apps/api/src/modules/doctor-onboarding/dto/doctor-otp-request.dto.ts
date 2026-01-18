import { IsEmail, IsEnum, IsString, IsUUID, ValidateIf } from 'class-validator';
import { OtpChannel } from '@prisma/client';

export class DoctorOtpRequestDto {
  @IsEnum(OtpChannel)
  channel: OtpChannel;

  @ValidateIf((value) => value.channel === OtpChannel.EMAIL)
  @IsEmail()
  email?: string;

  @ValidateIf((value) => value.channel === OtpChannel.SMS)
  @IsString()
  phone?: string;

  @IsUUID()
  countryId: string;
}
