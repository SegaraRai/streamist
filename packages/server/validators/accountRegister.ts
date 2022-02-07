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
import { IsRegion, tStringNormalizeSingleLine } from './utils';

export type IAccountCreateData = Pick<User, 'username' | 'displayName'> & {
  region: OSRegion;
  password: string;
};

export class VAccountCreateData implements IAccountCreateData {
  @IsString()
  @IsNotEmpty()
  @MinLength(ACCOUNT_USERNAME_MIN_LENGTH)
  @MaxLength(ACCOUNT_USERNAME_MAX_LENGTH)
  @Matches(ACCOUNT_USERNAME_REGEX)
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(ACCOUNT_PASSWORD_MIN_LENGTH)
  @MaxLength(ACCOUNT_PASSWORD_MAX_LENGTH)
  @Matches(ACCOUNT_PASSWORD_REGEX)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  displayName!: string;

  @IsRegion()
  region!: OSRegion;
}

export class VAccountCheckQuery {
  @IsString()
  @IsNotEmpty()
  @MinLength(ACCOUNT_USERNAME_MIN_LENGTH)
  @MaxLength(ACCOUNT_USERNAME_MAX_LENGTH)
  @Matches(ACCOUNT_USERNAME_REGEX)
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  username!: string;
}
