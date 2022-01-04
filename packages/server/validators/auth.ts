import { Type } from 'class-transformer';
import {
  Equals,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';

interface IAuthBodyPassword {
  grant_type: 'password';
  username: string;
  password: string;
}

class VAuthBodyPassword implements IAuthBodyPassword {
  @Equals('password')
  grant_type!: 'password';

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

interface IAuthBodyRefreshToken {
  grant_type: 'refresh_token';
  refresh_token: string;
}

class VAuthBodyRefreshToken implements IAuthBodyRefreshToken {
  @Equals('refresh_token')
  grant_type!: 'refresh_token';

  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}

export class VAuthBodyWrapper {
  @IsObject({
    message: 'grant_type must be either "password" or "refresh_token"',
  })
  @ValidateNested()
  @Type(() => Boolean, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'grant_type',
      subTypes: [
        { value: VAuthBodyPassword, name: 'password' },
        { value: VAuthBodyRefreshToken, name: 'refresh_token' },
      ],
    },
  })
  '!payload'!: VAuthBodyPassword | VAuthBodyRefreshToken;
}
