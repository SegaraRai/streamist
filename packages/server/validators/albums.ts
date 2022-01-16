import type { Album } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { ICoArtistUpdate, VCoArtistUpdate } from './coArtists';
import { IsId, IsUndefinable, tStringNormalizeSingleLine } from './utils';

export type IAlbumUpdateData = Partial<
  Pick<Album, 'title' | 'titleSort' | 'description' | 'artistId'>
> & {
  artistName?: string;
  coArtists?: ICoArtistUpdate;
};

export class VAlbumUpdateBody implements IAlbumUpdateData {
  @IsUndefinable()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  title?: string;

  @IsUndefinable()
  @IsString()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  titleSort?: string;

  @IsUndefinable()
  @IsString()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  description?: string;

  @IsUndefinable()
  @IsId()
  artistId?: string;

  @IsUndefinable()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  artistName?: string;

  @IsUndefinable()
  @ValidateNested()
  @Type(() => VCoArtistUpdate)
  coArtists?: VCoArtistUpdate;
}

export class VAlbumMergeBody {
  @IsId()
  toAlbumId!: string;
}
