import { IsEnum, IsString, Length, Matches } from 'class-validator';
import { OtpChannel } from '@prisma/client';

export class OtpVerifyDto {
  @IsString()
  identifier: string;

  @IsEnum(OtpChannel)
  channel: OtpChannel;

  @IsString()
  @Length(4, 10)
  @Matches(/^\d+$/)
  code: string;
}
