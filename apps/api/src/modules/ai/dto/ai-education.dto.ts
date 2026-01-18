import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AiEducationDto {
  @IsString()
  @MaxLength(500)
  topic: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;
}
