import { client } from './lib/client';
import { dbAlbumGetOrCreateByNameTx } from './album';
import { dbArtistGetOrCreateByNameTx } from './artist';
import { Album, Artist, Prisma, Track } from '$prisma/client';
import {
  generateAlbumId,
  generateArtistId,
  generateTrackId,
} from '$shared-server/generateId';
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
  | 'source'
  | 'sourceId'
  | 'files'
  | 'playlists'
  | 'tags'
  | 'coArtists'
>;

export async function dbTrackCreateTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  sourceId: string,
  albumTitle: string,
  albumArtistName: string,
  trackArtistName: string,
  data: CreateTrackData
): Promise<
  [track: Track, trackArtist: Artist, album: Album, albumArtist: Artist]
> {
  const isSameArtist = trackArtistName === albumArtistName;

  // TODO(pref): generate id before the transaction
  const albumArtistId = await generateArtistId();
  const albumId = await generateAlbumId();
  const trackArtistId = isSameArtist ? albumArtistId : await generateArtistId();
  const trackId = await generateTrackId();

  const albumArtist = await dbArtistGetOrCreateByNameTx(
    txClient,
    userId,
    albumArtistName,
    albumArtistId
  );

  const album = await dbAlbumGetOrCreateByNameTx(
    txClient,
    userId,
    albumArtistId,
    albumTitle,
    albumId
  );

  const trackArtist = isSameArtist
    ? albumArtist
    : await dbArtistGetOrCreateByNameTx(
        txClient,
        userId,
        trackArtistName,
        trackArtistId
      );

  const track = await txClient.track.create({
    data: {
      ...data,
      id: trackId,
      artistId: trackArtistId,
      albumId,
      sourceId,
      userId,
    },
  });

  return [track, trackArtist, album, albumArtist];
}

export function dbTrackCreate(
  userId: string,
  sourceId: string,
  albumTitle: string,
  albumArtistName: string,
  trackArtistName: string,
  data: CreateTrackData
): Promise<
  [track: Track, trackArtist: Artist, album: Album, albumArtist: Artist]
> {
  return client.$transaction(
    async (txClient): Promise<[Track, Artist, Album, Artist]> =>
      dbTrackCreateTx(
        txClient,
        userId,
        sourceId,
        albumTitle,
        albumArtistName,
        trackArtistName,
        data
      )
  );
}

export function dbTrackCount(userId: string): Promise<number> {
  return client.track.count({
    where: {
      userId,
    },
  });
}
