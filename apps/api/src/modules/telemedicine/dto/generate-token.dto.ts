import { IsOptional, IsUUID } from 'class-validator';

export class GenerateTokenDto {
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
