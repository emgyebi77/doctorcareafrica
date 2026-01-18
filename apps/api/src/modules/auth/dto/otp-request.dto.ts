import { IsEnum, IsString } from 'class-validator';
import { OtpChannel } from '@prisma/client';

export class OtpRequestDto {
  @IsString()
  identifier: string;

  @IsEnum(OtpChannel)
  channel: OtpChannel;
}
