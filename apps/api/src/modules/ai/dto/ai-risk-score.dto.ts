import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class AiRiskScoreDto {
  @IsString()
  @MaxLength(200)
  subject: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  factors?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  history?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
