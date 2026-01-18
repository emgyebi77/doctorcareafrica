import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsUUID()
  timeSlotId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
