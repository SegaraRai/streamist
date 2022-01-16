import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import type { CoArtistRole } from '$shared/coArtist';
import {
  IsCoArtistRole,
  IsId,
  IsUndefinable,
  tStringNormalizeSingleLine,
} from './utils';

export interface ICoArtistUpdateAdd {
  role: CoArtistRole;
  artistId?: string;
  artistName?: string;
}

export class VCoArtistUpdateAdd implements ICoArtistUpdateAdd {
  @IsCoArtistRole()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  role!: CoArtistRole;

  @IsUndefinable()
  @IsId()
  artistId?: string;

  @IsUndefinable()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  artistName?: string;
}

export interface ICoArtistUpdateRemove {
  role: CoArtistRole;
  artistId: string;
}

export class VCoArtistUpdateRemove implements ICoArtistUpdateRemove {
  @IsCoArtistRole()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  role!: CoArtistRole;

  @IsId()
  artistId!: string;
}

export interface ICoArtistUpdate {
  add?: ICoArtistUpdateAdd[];
  remove?: ICoArtistUpdateRemove[];
}

export class VCoArtistUpdate implements ICoArtistUpdate {
  @IsUndefinable()
  @IsArray()
  @ArrayUnique()
  @ValidateNested({ each: true })
  @Type(() => VCoArtistUpdateAdd)
  add?: VCoArtistUpdateAdd[];

  @IsUndefinable()
  @IsArray()
  @ArrayUnique()
  @ValidateNested({ each: true })
  @Type(() => VCoArtistUpdateRemove)
  remove?: VCoArtistUpdateRemove[];
}
