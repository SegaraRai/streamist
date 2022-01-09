import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsId, IsUndefinable } from './utils';
import {
  tStringNormalizeMultipleLines,
  tStringNormalizeSingleLine,
} from './utils/transform';

export class VArtistUpdateBody {
  @IsUndefinable()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  name?: string;

  @IsUndefinable()
  @IsString()
  @Transform(({ value }) => tStringNormalizeSingleLine(value))
  nameSort?: string;

  @IsUndefinable()
  @IsString()
  @Transform(({ value }) => tStringNormalizeMultipleLines(value))
  description?: string;
}

export class VArtistMergeBody {
  @IsId()
  toArtistId!: string;
}
