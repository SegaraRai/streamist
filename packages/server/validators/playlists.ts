import type { Playlist } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  Validate,
} from 'class-validator';
import {
  IsIdConstraint,
  IsUndefinable,
  tStringNormalizeMultipleLines,
  tStringNormalizeSingleLine,
} from './utils';

export type IPlaylistCreateData = Pick<Playlist, 'title' | 'description'> & {
  trackIds?: string[];
};

export class VPlaylistCreateBody implements IPlaylistCreateData {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  title!: string;

  @IsString()
  @Transform(({ value }) => tStringNormalizeMultipleLines(value))
  description!: string;

  @IsUndefinable()
  @IsArray()
  @ArrayUnique()
  @Validate(IsIdConstraint, { each: true })
  trackIds?: string[];
}

export type IPlaylistUpdateData = Partial<
  Pick<Playlist, 'title' | 'description'>
>;

export class VPlaylistUpdateBody implements IPlaylistUpdateData {
  @IsUndefinable()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  title?: string;

  @IsUndefinable()
  @IsString()
  @Transform(({ value }) => tStringNormalizeMultipleLines(value))
  description?: string;
}

export class VPlaylistAddTrackBody {
  @IsArray()
  @ArrayUnique()
  @Validate(IsIdConstraint, { each: true })
  trackIds!: string[];
}
