import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCountryDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(2)
  isoCode2: string;

  @IsString()
  @MaxLength(3)
  isoCode3: string;

  @IsString()
  @MaxLength(10)
  currency: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currencySymbol?: string;

  @IsString()
  @MaxLength(120)
  timezone: string;

  @IsString()
  @MaxLength(20)
  locale: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  dialingCode?: string;
}
