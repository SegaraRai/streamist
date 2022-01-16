import {
  generateAlbumId,
  generateTrackCoArtistId,
} from '$shared-server/generateId';
import { CoArtistRole, isValidCoArtistRole } from '$shared/coArtist';
import { Album, Artist, Prisma, Track } from '$prisma/client';
import { dbAlbumGetOrCreateByNameTx } from './album';
import { dbArtistCreateCachedGetOrCreateByNameTx } from './artist';
import { client } from './lib/client';
import type { TransactionalPrismaClient } from './lib/types';

export type CreateTrackData = Omit<
  Prisma.TrackCreateInput,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'user'
  | 'userId'
  | 'artist'
  | 'artistId'
  | 'album'
  | 'albumId'
  | 'files'
  | 'playlists'
  | 'coArtists'
>;

export interface CreateTrackInputCoArtist {
  role: CoArtistRole;
  artistName: string;
  artistNameSort: string | undefined;
}

export interface CreateTrackInput {
  albumTitle: string;
  albumArtistName: string;
  albumArtistNameSort: string | undefined;
  trackArtistName: string;
  trackArtistNameSort: string | undefined;
  coArtists: readonly CreateTrackInputCoArtist[];
  data: CreateTrackData;
}

export interface CreateTrackResultCoArtist {
  /** TrackCoArtist id */
  id: string;
  artist: Artist;
  input: CreateTrackInputCoArtist;
}

export interface CreateTrackResult {
  track: Track;
  trackArtist: Artist;
  album: Album;
  albumArtist: Artist;
  coArtists: CreateTrackResultCoArtist[];
}

export async function dbTrackCreateTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  newTrackId: string,
  {
    albumTitle,
    albumArtistName,
    albumArtistNameSort,
    trackArtistName,
    trackArtistNameSort,
    coArtists,
    data,
  }: CreateTrackInput
): Promise<CreateTrackResult> {
  const newAlbumId = await generateAlbumId();

  const artistGetOrCreateTx = dbArtistCreateCachedGetOrCreateByNameTx(
    txClient,
    userId
  );

  const albumArtist = await artistGetOrCreateTx(
    albumArtistName,
    albumArtistNameSort
  );

  const album = await dbAlbumGetOrCreateByNameTx(
    txClient,
    userId,
    albumArtist.id,
    albumTitle,
    newAlbumId
  );

  const trackArtist = await artistGetOrCreateTx(
    trackArtistName,
    trackArtistNameSort
  );

  const createdCoArtists = await Promise.all(
    coArtists
      .filter((coArtist) => isValidCoArtistRole(coArtist.role))
      .map(async (input) => ({
        id: await generateTrackCoArtistId(),
        artist: await artistGetOrCreateTx(
          input.artistName,
          input.artistNameSort
        ),
        input,
      }))
  );

  // remove duplicates
  const filteredResolvedCoArtists = Array.from(
    new Map(
      createdCoArtists.map((item) => [
        `${item.input.role}\n${item.input.artistName}`,
        item,
      ])
    ).values()
  );

  const timestamp = Date.now();

  const track = await txClient.track.create({
    data: {
      ...data,
      id: newTrackId,
      artist: { connect: { id: trackArtist.id } },
      album: { connect: { id: album.id } },
      user: { connect: { id: userId } },
      createdAt: timestamp,
      updatedAt: timestamp,
      coArtists: {
        create: filteredResolvedCoArtists.map(
          ({ id, artist, input: { role } }) => ({
            id,
            role,
            createdAt: timestamp,
            updatedAt: timestamp,
            artist: { connect: { id: artist.id } },
            user: { connect: { id: userId } },
          })
        ),
      },
    },
  });

  return {
    track,
    trackArtist,
    album,
    albumArtist,
    coArtists: filteredResolvedCoArtists,
  };
}

export function dbTrackCount(userId: string): Promise<number> {
  return client.track.count({
    where: {
      userId,
    },
  });
}
