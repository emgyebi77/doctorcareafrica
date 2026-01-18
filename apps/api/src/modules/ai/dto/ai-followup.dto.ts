import { IsString, MaxLength } from 'class-validator';

export class AiFollowUpDto {
  @IsString()
  @MaxLength(2000)
  plan: string;
}
