import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AiNotesAssistantDto {
  @IsString()
  @MaxLength(4000)
  notes: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  visitType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  encounterContext?: string;
}
