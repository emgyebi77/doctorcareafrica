import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreatePrescriptionDto {
  @IsUUID()
  encounterId: string;

  @IsString()
  @MaxLength(200)
  medicationName: string;

  @IsString()
  @MaxLength(200)
  dosage: string;

  @IsString()
  @MaxLength(200)
  frequency: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;
}
