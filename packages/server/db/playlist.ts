import { dbArraySort } from '$shared/dbArray';
import { Image, ImageFile, Prisma, Track } from '$prisma/client';
import {
  dbArrayAdd,
  dbArrayAddTx,
  dbArrayCreateMoveBeforeReorderCallback,
  dbArrayRemove,
  dbArrayRemoveAll,
  dbArrayRemoveTx,
  dbArrayReorder,
} from './lib/array';
import { client } from './lib/client';
import type { TransactionalPrismaClient } from './lib/types';

export type ImageSortablePlaylist = { imageOrder: string; images: Image[] };
export type TrackSortablePlaylist = { trackOrder: string; tracks: Track[] };

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

export function dbPlaylistSortTracks<T extends TrackSortablePlaylist>(
  playlist: T
): T {
  dbArraySort(playlist.tracks, playlist.trackOrder);
  return playlist;
}

export function dbPlaylistAddImageTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  playlistId: string,
  imageIds: string | readonly string[]
): Promise<void> {
  return dbArrayAddTx<typeof Prisma.PlaylistScalarFieldEnum>(
    txClient,
    userId,
    Prisma.ModelName.Playlist,
    Prisma.ModelName.Image,
    Prisma.PlaylistScalarFieldEnum.imageOrder,
    playlistId,
    imageIds
  );
}

export function dbPlaylistRemoveImageTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  playlistId: string,
  imageIds: string | readonly string[]
): Promise<void> {
  return dbArrayRemoveTx<typeof Prisma.PlaylistScalarFieldEnum>(
    txClient,
    userId,
    Prisma.ModelName.Playlist,
    Prisma.ModelName.Image,
    Prisma.PlaylistScalarFieldEnum.imageOrder,
    playlistId,
    imageIds
  );
}

export function dbPlaylistMoveImageBefore(
  userId: string,
  playlistId: string,
  imageId: string,
  referenceImageId?: string | null
): Promise<void> {
  return dbArrayReorder<typeof Prisma.PlaylistScalarFieldEnum>(
    userId,
    Prisma.ModelName.Playlist,
    Prisma.PlaylistScalarFieldEnum.imageOrder,
    playlistId,
    dbArrayCreateMoveBeforeReorderCallback(imageId, referenceImageId ?? null)
  );
}

export function dbPlaylistSortImages<T extends ImageSortablePlaylist>(
  playlist: T
): T {
  dbArraySort(playlist.images, playlist.imageOrder);
  return playlist;
}

export async function dbPlaylistGetImages(
  userId: string,
  playlistId: string
): Promise<(Image & { files: ImageFile[] })[]> {
  const playlist = await client.playlist.findFirst({
    where: {
      id: playlistId,
      userId,
    },
    select: {
      imageOrder: true,
      images: {
        include: {
          files: true,
        },
      },
    },
  });
  if (!playlist) {
    throw new Error(
      `dbPlaylistGetImages: playlist not found (userId=${userId}, playlistId=${playlistId})`
    );
  }
  return dbPlaylistSortImages(playlist).images;
}
