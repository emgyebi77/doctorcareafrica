import { IsEmail, IsEnum, IsString, Length, Matches, ValidateIf } from 'class-validator';
import { OtpChannel } from '@prisma/client';

export class DoctorOtpVerifyDto {
  @IsEnum(OtpChannel)
  channel: OtpChannel;

  @ValidateIf((value) => value.channel === OtpChannel.EMAIL)
  @IsEmail()
  email?: string;

  @ValidateIf((value) => value.channel === OtpChannel.SMS)
  @IsString()
  phone?: string;

  @IsString()
  @Length(4, 10)
  @Matches(/^\d+$/)
  code: string;
}
