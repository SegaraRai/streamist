import {
  APlaylistImage,
  APlaylistTrack,
  Image,
  ImageFile,
  Prisma,
  Track,
  TrackFile,
} from '$prisma/client';
import {
  TableWithSortedItems,
  dbArrayAdd,
  dbArrayAddTx,
  dbArrayCreateMoveBeforeReorderCallback,
  dbArrayGetSortedItems,
  dbArrayRemove,
  dbArrayRemoveAll,
  dbArrayRemoveTx,
  dbArrayReorder,
} from './lib/array';
import { client } from './lib/client';
import { dbImageArrayConvert } from './lib/image';
import { dbTrackArrayConvert } from './lib/track';
import type { TransactionalPrismaClient } from './lib/types';

export type ImageSortablePlaylist<T extends Image> = {
  imageOrder: string;
  images: (APlaylistImage & { image: T })[];
};
export type TrackSortablePlaylist<T extends Track> = {
  trackOrder: string;
  tracks: (APlaylistTrack & { track: T })[];
};

export function dbPlaylistAddTrackTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  playlistId: string,
  trackIds: string | readonly string[]
): Promise<void> {
  return dbArrayAddTx<typeof Prisma.PlaylistScalarFieldEnum>(
    txClient,
    userId,
    Prisma.ModelName.APlaylistTrack,
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
    Prisma.ModelName.APlaylistTrack,
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
    Prisma.ModelName.APlaylistTrack,
    Prisma.ModelName.Playlist,
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
    Prisma.ModelName.APlaylistTrack,
    Prisma.ModelName.Playlist,
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
    Prisma.ModelName.APlaylistTrack,
    Prisma.ModelName.Playlist,
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

export function dbPlaylistConvertTracks<
  V extends Track,
  T extends TrackSortablePlaylist<V>
>(playlist: T): TableWithSortedItems<'track', V, T> {
  return dbTrackArrayConvert(playlist);
}

export async function dbPlaylistGetTracks(
  userId: string,
  playlistId: string
): Promise<(Track & { files: TrackFile[] })[]> {
  const playlist = await client.playlist.findFirst({
    where: {
      id: playlistId,
      userId,
    },
    select: {
      trackOrder: true,
      tracks: {
        select: {
          track: {
            include: {
              files: true,
            },
          },
        },
      },
    },
  });
  if (!playlist) {
    throw new Error(
      `dbPlaylistGetTracks: playlist not found (userId=${userId}, playlistId=${playlistId})`
    );
  }
  return dbArrayGetSortedItems<
    'track',
    typeof playlist['tracks'][number]['track']
  >(playlist.tracks, playlist.trackOrder, 'track');
}

export function dbPlaylistAddImageTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  playlistId: string,
  imageIds: string | readonly string[],
  prepend = false
): Promise<void> {
  return dbArrayAddTx<typeof Prisma.PlaylistScalarFieldEnum>(
    txClient,
    userId,
    Prisma.ModelName.APlaylistImage,
    Prisma.ModelName.Playlist,
    Prisma.ModelName.Image,
    Prisma.PlaylistScalarFieldEnum.imageOrder,
    playlistId,
    imageIds,
    prepend
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
    Prisma.ModelName.APlaylistImage,
    Prisma.ModelName.Playlist,
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

export function dbPlaylistConvertImages<
  V extends Image,
  T extends ImageSortablePlaylist<V>
>(playlist: T): TableWithSortedItems<'image', V, T> {
  return dbImageArrayConvert<V, T>(playlist);
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
        select: {
          image: {
            include: {
              files: true,
            },
          },
        },
      },
    },
  });
  if (!playlist) {
    throw new Error(
      `dbPlaylistGetImages: playlist not found (userId=${userId}, playlistId=${playlistId})`
    );
  }
  return dbArrayGetSortedItems<
    'image',
    typeof playlist['images'][number]['image']
  >(playlist.images, playlist.imageOrder, 'image');
}
