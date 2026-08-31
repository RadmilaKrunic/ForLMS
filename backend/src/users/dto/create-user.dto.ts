import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

/** For local (non-AD) admin accounts — see ELR_LMS_009. */
export class CreateLocalUserDto {
  @IsString()
  username!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(['Administrator', 'ContentManager', 'Learner'])
  role!: string;
}
