import { Transform } from 'class-transformer';
import {
  Equals,
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
import { tStringNormalizeSingleLine } from './utils';

export interface IAuthBodyPassword {
  grant_type: 'password';
  username: string;
  password: string;
}

export class VAuthBodyPassword implements IAuthBodyPassword {
  @Equals('password')
  grant_type!: 'password';

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
}

export interface IAuthBodyRefreshToken {
  grant_type: 'refresh_token';
  refresh_token: string;
}

export class VAuthBodyRefreshToken implements IAuthBodyRefreshToken {
  @Equals('refresh_token')
  grant_type!: 'refresh_token';

  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}

export interface IAuthResponse {
  access_token: string;
  cdn_access_token: string;
  refresh_token?: string;
}
