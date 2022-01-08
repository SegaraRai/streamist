import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import type { AlbumUpdateData } from '$/services/albums';
import { IsId, IsUndefinable } from './utils';
import { tStringNormalizeSingleLine } from './utils/transform';

export class VAlbumUpdateBody implements AlbumUpdateData {
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
