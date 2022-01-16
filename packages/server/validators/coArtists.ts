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

export class VCoArtistUpdateAdd {
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

export class VCoArtistUpdateRemove {
  @IsCoArtistRole()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  role!: CoArtistRole;

  @IsId()
  artistId!: string;
}

export interface ICoArtistUpdate {
  add?: VCoArtistUpdateAdd[];
  remove?: VCoArtistUpdateRemove[];
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
