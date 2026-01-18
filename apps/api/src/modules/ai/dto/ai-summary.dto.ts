import { IsString, MaxLength } from 'class-validator';

export class AiSummaryDto {
  @IsString()
  @MaxLength(4000)
  notes: string;
}
