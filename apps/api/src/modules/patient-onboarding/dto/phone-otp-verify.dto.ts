import { IsString, Length, Matches } from 'class-validator';

export class PhoneOtpVerifyDto {
  @IsString()
  phone: string;

  @IsString()
  @Length(4, 10)
  @Matches(/^\d+$/)
  code: string;
}
