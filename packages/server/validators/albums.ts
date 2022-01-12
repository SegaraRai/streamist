import type { Album } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsId, IsUndefinable } from './utils';
import { tStringNormalizeSingleLine } from './utils/transform';

export type IAlbumUpdateData = Partial<
  Pick<Album, 'title' | 'titleSort' | 'description' | 'artistId'>
> & {
  artistName?: string;
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
}

export class VAlbumMergeBody {
  @IsId()
  toAlbumId!: string;
}
