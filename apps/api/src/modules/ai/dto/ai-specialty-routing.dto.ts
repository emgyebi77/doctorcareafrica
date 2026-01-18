import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AiSpecialtyRoutingDto {
  @IsString()
  @MaxLength(2000)
  symptoms: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  context?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  preferredLanguage?: string;
}
