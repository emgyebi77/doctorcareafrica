import { Type } from 'class-transformer';
import { IsDate, IsString, IsUUID } from 'class-validator';

export class DoctorTimeSlotDto {
  @IsUUID()
  availabilityId: string;

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @IsString()
  timezone: string;
}
