import type { Playlist } from '@prisma/client';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  Matches,
  Validate,
} from 'class-validator';
import { IsIdConstraint, IsUndefinable } from './utils';

type IPlaylistCreateBody = Pick<Playlist, 'title' | 'notes'> & {
  trackIds?: string[];
};

export class VPlaylistCreateBody implements IPlaylistCreateBody {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  title!: string;

  @IsString()
  notes!: string;

  @IsUndefinable()
  @IsArray()
  @Validate(IsIdConstraint, { each: true })
  trackIds?: string[];
}

type IPlaylistUpdateBody = Partial<Pick<Playlist, 'title' | 'notes'>>;

export class VPlaylistUpdateBody implements IPlaylistUpdateBody {
  @IsUndefinable()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  title!: string;

  @IsUndefinable()
  @IsString()
  notes!: string;
}

export class VPlaylistAddTrackBody {
  @IsArray()
  @Validate(IsIdConstraint, { each: true })
  trackIds!: string[];
}
