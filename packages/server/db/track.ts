import {
  generateAlbumId,
  generateArtistId,
  generateTrackId,
} from '$shared-server/generateId';
import { Album, Artist, Prisma, Track } from '$prisma/client';
import { dbAlbumGetOrCreateByNameTx } from './album';
import { dbArtistGetOrCreateByNameTx } from './artist';
import { client } from './lib/client';
import type { TransactionalPrismaClient } from './lib/types';

export type CreateTrackData = Omit<
  Prisma.TrackUncheckedCreateInput,
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
  | 'tags'
  | 'coArtists'
>;

export async function dbTrackCreateTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  albumTitle: string,
  albumArtistName: string,
  trackArtistName: string,
  data: CreateTrackData
): Promise<
  [track: Track, trackArtist: Artist, album: Album, albumArtist: Artist]
> {
  const isSameArtist = trackArtistName === albumArtistName;

  // TODO(pref): generate id before the transaction
  const newAlbumArtistId = await generateArtistId();
  const newAlbumId = await generateAlbumId();
  const newTrackArtistId = isSameArtist ? null : await generateArtistId();
  const newTrackId = await generateTrackId();

  const albumArtist = await dbArtistGetOrCreateByNameTx(
    txClient,
    userId,
    albumArtistName,
    newAlbumArtistId
  );

  const album = await dbAlbumGetOrCreateByNameTx(
    txClient,
    userId,
    albumArtist.id,
    albumTitle,
    newAlbumId
  );

  const trackArtist = isSameArtist
    ? albumArtist
    : await dbArtistGetOrCreateByNameTx(
        txClient,
        userId,
        trackArtistName,
        newTrackArtistId!
      );

  const track = await txClient.track.create({
    data: {
      ...data,
      id: newTrackId,
      artistId: trackArtist.id,
      albumId: album.id,
      userId,
    },
  });

  return [track, trackArtist, album, albumArtist];
}

export function dbTrackCreate(
  userId: string,
  albumTitle: string,
  albumArtistName: string,
  trackArtistName: string,
  data: CreateTrackData
): Promise<
  [track: Track, trackArtist: Artist, album: Album, albumArtist: Artist]
> {
  return client.$transaction(
    (txClient): Promise<[Track, Artist, Album, Artist]> =>
      dbTrackCreateTx(
        txClient,
        userId,
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
