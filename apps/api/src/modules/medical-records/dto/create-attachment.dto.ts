import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateAttachmentDto {
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsUUID()
  medicalRecordId?: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsUUID()
  prescriptionId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsString()
  fileName: string;

  @IsString()
  fileUrl: string;

  @IsString()
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(52428800)
  sizeBytes: number;

  @IsOptional()
  @IsString()
  checksum?: string;

  @IsOptional()
  @IsString()
  storageProvider?: string;
}
