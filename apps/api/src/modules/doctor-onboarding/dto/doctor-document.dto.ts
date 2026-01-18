import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { KycDocumentType } from '@prisma/client';

export class DoctorDocumentDto {
  @IsEnum(KycDocumentType)
  type: KycDocumentType;

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
