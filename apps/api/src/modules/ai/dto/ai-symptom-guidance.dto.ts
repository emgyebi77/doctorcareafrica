import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AiSymptomGuidanceDto {
  @IsString()
  @MaxLength(2000)
  symptoms: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  duration?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  context?: string;
}
