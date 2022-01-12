import type { Artist } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsId, IsUndefinable } from './utils';
import {
  tStringNormalizeMultipleLines,
  tStringNormalizeSingleLine,
} from './utils/transform';

export type IArtistUpdateData = Partial<
  Pick<Artist, 'name' | 'nameSort' | 'description'>
>;

export class VArtistUpdateBody implements IArtistUpdateData {
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
