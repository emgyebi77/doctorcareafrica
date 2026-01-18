import { IsString, MaxLength } from 'class-validator';

export class AiTranslateDto {
  @IsString()
  @MaxLength(4000)
  text: string;

  @IsString()
  @MaxLength(20)
  targetLanguage: string;
}
