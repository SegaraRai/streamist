import {
  generateAlbumId,
  generateTrackCoArtistId,
  generateTrackId,
} from '$shared-server/generateId';
import { CoArtistType, isValidCoArtistType } from '$shared/coArtist';
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

export interface CreateTrackInput {
  albumTitle: string;
  albumArtistName: string;
  albumArtistNameSort: string | undefined;
  trackArtistName: string;
  trackArtistNameSort: string | undefined;
  coArtists: readonly (readonly [
    role: CoArtistType,
    artistName: string,
    artistNameSort: string | undefined
  ])[];
  data: CreateTrackData;
}

export interface CreateTrackResult {
  track: Track;
  trackArtist: Artist;
  album: Album;
  albumArtist: Artist;
  coArtists: (readonly [
    role: CoArtistType,
    coArtistId: string,
    artist: Artist,
    artistNameSort: string | undefined
  ])[];
}

export async function dbTrackCreateTx(
  txClient: TransactionalPrismaClient,
  userId: string,
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
  // TODO(pref): generate id before the transaction
  const newAlbumId = await generateAlbumId();
  const newTrackId = await generateTrackId();

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

  const resolvedCoArtists = await Promise.all(
    coArtists
      .filter((coArtist) => isValidCoArtistType(coArtist[0]))
      .map(
        async ([coArtistType, coArtistName, coArtistNameSort]) =>
          [
            coArtistType,
            await generateTrackCoArtistId(),
            await artistGetOrCreateTx(coArtistName, coArtistNameSort),
            coArtistNameSort,
          ] as const
      )
  );

  // remove duplicates
  const filteredResolvedCoArtists = Array.from(
    new Map(
      resolvedCoArtists.map((item) => [`${item[0]}\n${item[2].id}`, item])
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
        create: filteredResolvedCoArtists.map(([id, role, artist]) => ({
          id,
          role,
          createdAt: timestamp,
          updatedAt: timestamp,
          artist: { connect: { id: artist.id } },
          user: { connect: { id: userId } },
        })),
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
