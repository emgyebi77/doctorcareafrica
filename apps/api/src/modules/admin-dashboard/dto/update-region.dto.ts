import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRegionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;
}
