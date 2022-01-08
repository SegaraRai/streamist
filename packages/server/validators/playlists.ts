import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  Validate,
} from 'class-validator';
import type {
  PlaylistCreateData,
  PlaylistUpdateData,
} from '$/services/playlists';
import { IsIdConstraint, IsUndefinable } from './utils';
import {
  tStringNormalizeMultipleLines,
  tStringNormalizeSingleLine,
} from './utils/transform';
export class VPlaylistCreateBody implements PlaylistCreateData {
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

export class VPlaylistUpdateBody implements PlaylistUpdateData {
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
