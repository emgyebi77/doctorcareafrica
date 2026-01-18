import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { AppointmentType } from '@prisma/client';

export class BookAppointmentDto {
  @IsUUID()
  timeSlotId: string;

  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
