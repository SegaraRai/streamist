import type { Track } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { IsId, IsNullable, IsUndefinable } from './utils';
import {
  tStringNormalizeMultipleLines,
  tStringNormalizeSingleLine,
} from './utils/transform';

export type ITrackUpdateData = Partial<
  Pick<
    Track,
    | 'title'
    | 'titleSort'
    | 'discNumber'
    | 'trackNumber'
    | 'comment'
    | 'lyrics'
    | 'releaseDateText'
    | 'genre'
    | 'bpm'
    | 'albumId'
    | 'artistId'
  >
> & {
  artistName?: string;
  albumTitle?: string;
};

export class VTrackOrderUpdateBody {
  @IsNullable()
  @IsId()
  nextTrackId!: string | null;
}

export class VTrackUpdateBody implements ITrackUpdateData {
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
  @IsInt()
  @Min(1)
  discNumber?: number;

  @IsUndefinable()
  @IsInt()
  @Min(1)
  trackNumber?: number;

  @IsUndefinable()
  @IsString()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  comment?: string;

  @IsUndefinable()
  @IsString()
  @Transform(({ value }) => tStringNormalizeMultipleLines(value))
  lyrics?: string;

  @IsUndefinable()
  @IsString()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  releaseDateText?: string;

  @IsUndefinable()
  @IsString()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  genre?: string;

  @IsUndefinable()
  @IsNullable()
  @IsInt()
  @Min(1)
  bpm?: number | null;

  @IsUndefinable()
  @IsId()
  albumId?: string;

  @IsUndefinable()
  @IsId()
  artistId?: string;

  @IsUndefinable()
  @IsString()
  @IsNotEmpty()
  albumTitle?: string;

  @IsUndefinable()
  @IsString()
  @IsNotEmpty()
  artistName?: string;
}
