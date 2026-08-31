import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

/** SCORM 1.2 CMI data submitted by the player on Commit/Terminate. */
export class CommitCmiDto {
  @IsObject()
  cmiData!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  lessonStatus?: string;

  @IsOptional()
  @IsNumber()
  scoreRaw?: number;

  @IsOptional()
  @IsString()
  sessionTime?: string;

  @IsOptional()
  @IsString()
  suspendData?: string;
}
