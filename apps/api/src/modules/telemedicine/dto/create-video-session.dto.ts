import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateVideoSessionDto {
  @IsUUID()
  appointmentId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  jitsiRegion?: string;
}
