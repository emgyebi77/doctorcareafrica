import { IsString, MaxLength } from 'class-validator';

export class AiSafetyCheckDto {
  @IsString()
  @MaxLength(4000)
  content: string;
}
