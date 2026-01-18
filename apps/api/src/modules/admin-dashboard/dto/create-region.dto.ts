import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateRegionDto {
  @IsUUID()
  countryId: string;

  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;
}
