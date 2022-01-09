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
export class VPlaylistCreateBody {
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

export class VPlaylistUpdateBody {
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
