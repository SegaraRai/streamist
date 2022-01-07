import type { Playlist } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  Validate,
} from 'class-validator';
import { IsIdConstraint, IsUndefinable } from './utils';
import {
  tStringNormalizeMultipleLines,
  tStringNormalizeSingleLine,
} from './utils/transform';

type IPlaylistCreateBody = Pick<Playlist, 'title' | 'notes'> & {
  trackIds?: string[];
};

export class VPlaylistCreateBody implements IPlaylistCreateBody {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  title!: string;

  @IsString()
  @Transform(({ value }) => tStringNormalizeMultipleLines(value))
  notes!: string;

  @IsUndefinable()
  @IsArray()
  @ArrayUnique()
  @Validate(IsIdConstraint, { each: true })
  trackIds?: string[];
}

type IPlaylistUpdateBody = Partial<Pick<Playlist, 'title' | 'notes'>>;

export class VPlaylistUpdateBody implements IPlaylistUpdateBody {
  @IsUndefinable()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  title?: string;

  @IsUndefinable()
  @IsString()
  @Transform(({ value }) => tStringNormalizeMultipleLines(value))
  notes?: string;
}

export class VPlaylistAddTrackBody {
  @IsArray()
  @ArrayUnique()
  @Validate(IsIdConstraint, { each: true })
  trackIds!: string[];
}
