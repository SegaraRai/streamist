import { Playlist, Prisma, Track } from '$prisma/client';
import { client } from './lib/client';
import { PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID } from './lib/config';
import {
  dbLinkedListAppend,
  dbLinkedListAppendTx,
  dbLinkedListMoveBefore,
  dbLinkedListRemove,
  dbLinkedListRemoveAll,
  dbLinkedListRemoveTx,
} from './lib/linkedList';
import { dbLinkedListSort } from './lib/linkedListSort';
import type { TransactionalPrismaClient } from './lib/types';

export async function dbPlaylistCreateTx(
  txClient: TransactionalPrismaClient,
  data: Prisma.PlaylistCreateArgs['data'] & { userId: string }
): Promise<Playlist> {
  const playlist = await txClient.playlist.create({ data });

  // create sentinel
  await txClient.playlistTrack.create({
    data: {
      userId: data.userId,
      playlistId: data.id,
      trackId: PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID,
      nextTrackId: null,
    },
  });

  return playlist;
}

export function dbPlaylistCreate(
  data: Prisma.PlaylistCreateArgs['data'] & { userId: string }
): Promise<Playlist> {
  return client.$transaction(
    (txClient): Promise<Playlist> => dbPlaylistCreateTx(txClient, data)
  );
}

export async function dbPlaylistRemoveTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  playlistId: string
): Promise<void> {
  await txClient.playlistTrack.deleteMany({
    where: {
      userId,
      playlistId,
    },
  });

  await txClient.playlist.deleteMany({
    where: {
      id: playlistId,
      userId,
    },
  });
}

export function dbPlaylistRemove(
  userId: string,
  playlistId: string
): Promise<void> {
  return client.$transaction(
    (txClient): Promise<void> =>
      dbPlaylistRemoveTx(txClient, userId, playlistId)
  );
}

export async function dbPlaylistAddTrackTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  playlistId: string,
  trackId: string
): Promise<void> {
  if (trackId === PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID) {
    throw new Error('invalid parameter');
  }
  await dbLinkedListAppendTx<typeof Prisma.PlaylistTrackScalarFieldEnum>(
    txClient,
    Prisma.ModelName.PlaylistTrack,
    userId,
    Prisma.PlaylistTrackScalarFieldEnum.playlistId,
    playlistId,
    Prisma.PlaylistTrackScalarFieldEnum.trackId,
    Prisma.PlaylistTrackScalarFieldEnum.nextTrackId,
    trackId
  );
}

export async function dbPlaylistAddTrack(
  userId: string,
  playlistId: string,
  trackId: string
): Promise<void> {
  if (trackId === PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID) {
    throw new Error('invalid parameter');
  }
  await dbLinkedListAppend<typeof Prisma.PlaylistTrackScalarFieldEnum>(
    Prisma.ModelName.PlaylistTrack,
    userId,
    Prisma.PlaylistTrackScalarFieldEnum.playlistId,
    playlistId,
    Prisma.PlaylistTrackScalarFieldEnum.trackId,
    Prisma.PlaylistTrackScalarFieldEnum.nextTrackId,
    trackId
  );
}

export async function dbPlaylistRemoveTrackTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  playlistId: string,
  trackId: string
): Promise<void> {
  if (trackId === PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID) {
    throw new Error('invalid parameter');
  }
  await dbLinkedListRemoveTx<typeof Prisma.PlaylistTrackScalarFieldEnum>(
    txClient,
    Prisma.ModelName.PlaylistTrack,
    userId,
    Prisma.PlaylistTrackScalarFieldEnum.playlistId,
    playlistId,
    Prisma.PlaylistTrackScalarFieldEnum.trackId,
    Prisma.PlaylistTrackScalarFieldEnum.nextTrackId,
    trackId
  );
}

export async function dbPlaylistRemoveTrack(
  userId: string,
  playlistId: string,
  trackId: string
): Promise<void> {
  if (trackId === PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID) {
    throw new Error('invalid parameter');
  }
  await dbLinkedListRemove<typeof Prisma.PlaylistTrackScalarFieldEnum>(
    Prisma.ModelName.PlaylistTrack,
    userId,
    Prisma.PlaylistTrackScalarFieldEnum.playlistId,
    playlistId,
    Prisma.PlaylistTrackScalarFieldEnum.trackId,
    Prisma.PlaylistTrackScalarFieldEnum.nextTrackId,
    trackId
  );
}

export async function dbPlaylistRemoveAllTracks(
  userId: string,
  playlistId: string
): Promise<void> {
  await dbLinkedListRemoveAll<typeof Prisma.PlaylistTrackScalarFieldEnum>(
    Prisma.ModelName.PlaylistTrack,
    userId,
    Prisma.PlaylistTrackScalarFieldEnum.playlistId,
    playlistId,
    Prisma.PlaylistTrackScalarFieldEnum.trackId,
    Prisma.PlaylistTrackScalarFieldEnum.nextTrackId,
    PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID
  );
}

export async function dbPlaylistMoveTrackBefore(
  userId: string,
  playlistId: string,
  trackId: string,
  referenceTrackId?: string
): Promise<void> {
  if (
    trackId === PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID ||
    referenceTrackId === PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID
  ) {
    throw new Error('invalid parameter');
  }
  if (!referenceTrackId) {
    // insert into front
    referenceTrackId = PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID;
  }
  await dbLinkedListMoveBefore<typeof Prisma.PlaylistTrackScalarFieldEnum>(
    Prisma.ModelName.PlaylistTrack,
    userId,
    Prisma.PlaylistTrackScalarFieldEnum.playlistId,
    playlistId,
    Prisma.PlaylistTrackScalarFieldEnum.trackId,
    Prisma.PlaylistTrackScalarFieldEnum.nextTrackId,
    trackId,
    referenceTrackId
  );
}

export async function dbPlaylistGetTracks(
  userId: string,
  playlistId: string
): Promise<Track[]> {
  return dbLinkedListSort(
    await client.playlistTrack.findMany({
      where: {
        userId,
        playlistId,
      },
      include: {
        track: true,
      },
    }),
    Prisma.PlaylistTrackScalarFieldEnum.trackId,
    Prisma.PlaylistTrackScalarFieldEnum.nextTrackId,
    PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID
  ).map((playlistTrack) => playlistTrack.track);
}
