import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCityDto {
  @IsUUID()
  countryId: string;

  @IsUUID()
  regionId: string;

  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;
}
