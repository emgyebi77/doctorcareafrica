import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AvailabilityType } from '@prisma/client';

export class CreateAvailabilityDto {
  @IsEnum(AvailabilityType)
  type: AvailabilityType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @IsString()
  timezone: string;
}
