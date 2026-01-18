import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EmergencyContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyContactPhone?: string;
}
