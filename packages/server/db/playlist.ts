import { dbArraySort } from '$shared/dbArray';
import { Prisma, Track } from '$prisma/client';
import {
  dbArrayAdd,
  dbArrayAddTx,
  dbArrayCreateMoveBeforeReorderCallback,
  dbArrayRemove,
  dbArrayRemoveAll,
  dbArrayRemoveTx,
  dbArrayReorder,
} from './lib/array';
import type { TransactionalPrismaClient } from './lib/types';

export function dbPlaylistAddTrackTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  playlistId: string,
  trackIds: string | readonly string[]
): Promise<void> {
  return dbArrayAddTx<typeof Prisma.PlaylistScalarFieldEnum>(
    txClient,
    userId,
    Prisma.ModelName.Playlist,
    Prisma.ModelName.Track,
    Prisma.PlaylistScalarFieldEnum.trackOrder,
    playlistId,
    trackIds
  );
}

export function dbPlaylistAddTrack(
  userId: string,
  playlistId: string,
  trackIds: string | readonly string[]
): Promise<void> {
  return dbArrayAdd<typeof Prisma.PlaylistScalarFieldEnum>(
    userId,
    Prisma.ModelName.Playlist,
    Prisma.ModelName.Track,
    Prisma.PlaylistScalarFieldEnum.trackOrder,
    playlistId,
    trackIds
  );
}

export function dbPlaylistRemoveTrackTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  playlistId: string,
  trackIds: string | readonly string[]
): Promise<void> {
  return dbArrayRemoveTx<typeof Prisma.PlaylistScalarFieldEnum>(
    txClient,
    userId,
    Prisma.ModelName.Playlist,
    Prisma.ModelName.Track,
    Prisma.PlaylistScalarFieldEnum.trackOrder,
    playlistId,
    trackIds
  );
}

export function dbPlaylistRemoveTrack(
  userId: string,
  playlistId: string,
  trackIds: string | readonly string[]
): Promise<void> {
  return dbArrayRemove<typeof Prisma.PlaylistScalarFieldEnum>(
    userId,
    Prisma.ModelName.Playlist,
    Prisma.ModelName.Track,
    Prisma.PlaylistScalarFieldEnum.trackOrder,
    playlistId,
    trackIds
  );
}

export function dbPlaylistRemoveAllTracks(
  userId: string,
  playlistId: string
): Promise<void> {
  return dbArrayRemoveAll<typeof Prisma.PlaylistScalarFieldEnum>(
    userId,
    Prisma.ModelName.Playlist,
    Prisma.ModelName.Track,
    Prisma.PlaylistScalarFieldEnum.trackOrder,
    playlistId
  );
}

export function dbPlaylistMoveTrackBefore(
  userId: string,
  playlistId: string,
  trackId: string,
  referenceTrackId?: string
): Promise<void> {
  return dbArrayReorder<typeof Prisma.PlaylistScalarFieldEnum>(
    userId,
    Prisma.ModelName.Playlist,
    Prisma.PlaylistScalarFieldEnum.trackOrder,
    playlistId,
    dbArrayCreateMoveBeforeReorderCallback(trackId, referenceTrackId ?? null)
  );
}

export function dbPlaylistSortTracks<
  T extends { trackOrder: string; tracks: Track[] }
>(playlist: T): T {
  dbArraySort(playlist.tracks, playlist.trackOrder);
  return playlist;
}
