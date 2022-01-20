import type { User } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ACCOUNT_PASSWORD_MAX_LENGTH,
  ACCOUNT_PASSWORD_MIN_LENGTH,
  ACCOUNT_PASSWORD_REGEX,
  ACCOUNT_USERNAME_MAX_LENGTH,
  ACCOUNT_USERNAME_MIN_LENGTH,
  ACCOUNT_USERNAME_REGEX,
} from '$shared/config';
import type { OSRegion } from '$shared/objectStorage';
import { IsRegion, IsUndefinable, tStringNormalizeSingleLine } from './utils';

export type IAccountUpdateData = Partial<
  Pick<User, 'username' | 'displayName' | 'region'>
> & {
  region?: OSRegion;
  password?: string;
  currentPassword?: string;
};

export class VAccountUpdateData implements IAccountUpdateData {
  @IsUndefinable()
  @IsString()
  @IsNotEmpty()
  @MinLength(ACCOUNT_USERNAME_MIN_LENGTH)
  @MaxLength(ACCOUNT_USERNAME_MAX_LENGTH)
  @Matches(ACCOUNT_USERNAME_REGEX)
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  username?: string;

  @IsUndefinable()
  @IsString()
  @IsNotEmpty()
  @MinLength(ACCOUNT_PASSWORD_MIN_LENGTH)
  @MaxLength(ACCOUNT_PASSWORD_MAX_LENGTH)
  @Matches(ACCOUNT_PASSWORD_REGEX)
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  password?: string;

  @IsUndefinable()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  displayName?: string;

  @IsUndefinable()
  @IsRegion()
  region?: OSRegion;

  /** required for updating username and password */
  @IsUndefinable()
  @IsString()
  @IsNotEmpty()
  @MinLength(ACCOUNT_PASSWORD_MIN_LENGTH)
  @MaxLength(ACCOUNT_PASSWORD_MAX_LENGTH)
  @Matches(ACCOUNT_PASSWORD_REGEX)
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  currentPassword?: string;
}
