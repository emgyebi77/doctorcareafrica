import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { RoleType } from '@prisma/client';

export class DoctorProfileDto {
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(80)
  yearsExperience?: number;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  @IsUUID()
  countryId: string;

  @IsOptional()
  @IsUUID()
  regionId?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DoctorProfileDto)
  doctorProfile?: DoctorProfileDto;
}
