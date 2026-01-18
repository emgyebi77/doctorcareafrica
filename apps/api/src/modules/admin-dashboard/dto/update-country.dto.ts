import { IsArray, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCountryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currencySymbol?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  supportedLocales?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  jitsiRegion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  momoProvider?: string;

  @IsOptional()
  @IsObject()
  momoProviders?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  dialingCode?: string;
}
