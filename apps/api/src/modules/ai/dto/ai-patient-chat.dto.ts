import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AiPatientChatDto {
  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  context?: string;
}
