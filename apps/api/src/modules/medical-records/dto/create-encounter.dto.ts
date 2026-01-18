import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateEncounterDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @Type(() => Date)
  @IsDate()
  occurredAt: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  diagnosis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}
