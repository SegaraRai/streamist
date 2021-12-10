import { expectType } from 'tsd';
import { generateAlbumId } from '$shared-server/generateId';
import { dbArraySort } from '$shared/dbArray';
import { Album, Image, ImageFile, Prisma } from '$prisma/client';
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

export type ImageSortableAlbum = { imageOrder: string; images: Image[] };

// check types for `dbAlbumGetOrCreateByNameTx`
/* #__PURE__ */ expectType<'Album'>(Prisma.ModelName.Album);
/* #__PURE__ */ expectType<'id'>(Prisma.AlbumScalarFieldEnum.id);
/* #__PURE__ */ expectType<'title'>(Prisma.AlbumScalarFieldEnum.title);
/* #__PURE__ */ expectType<'artistId'>(Prisma.AlbumScalarFieldEnum.artistId);
/* #__PURE__ */ expectType<'userId'>(Prisma.AlbumScalarFieldEnum.userId);

export async function dbAlbumGetOrCreateByNameTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  artistId: string,
  albumTitle: string,
  newAlbumIdPromise: string | Promise<string> = generateAlbumId()
): Promise<Album> {
  const newAlbumId = await newAlbumIdPromise;

  // TODO(db): manually set createdAt and updatedAt?
  // NOTE: DO NOT check inserted row count. it's ok if it's 0.
  await txClient.$executeRaw`
    INSERT INTO Album (id, title, artistId, userId)
    SELECT ${newAlbumId}, ${albumTitle}, ${artistId}, ${userId}
      WHERE NOT EXISTS (
        SELECT 1
          FROM Album
          WHERE userId = ${userId} AND artistId = ${artistId} AND title = ${albumTitle}
      )
      LIMIT 1
    `;

  const album = await txClient.album.findFirst({
    where: {
      title: albumTitle,
      artistId,
      userId,
    },
  });
  if (!album) {
    // should not occur
    throw new Error(
      `dbAlbumGetOrCreateByNameTx: failed to get (userId=${userId}, artistId=${artistId}, albumTitle=${albumTitle})`
    );
  }

  return album;
}

export async function dbAlbumGetOrCreateByName(
  userId: string,
  artistId: string,
  albumTitle: string,
  newAlbumIdPromise: string | Promise<string> = generateAlbumId()
): Promise<Album> {
  // resolve Promise in advance to reduce transaction processing time
  const newAlbumId = await newAlbumIdPromise;
  return client.$transaction(
    (txClient): Promise<Album> =>
      dbAlbumGetOrCreateByNameTx(
        txClient,
        userId,
        artistId,
        albumTitle,
        newAlbumId
      )
  );
}

export function dbAlbumAddImageTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  albumId: string,
  imageIds: string | readonly string[]
): Promise<void> {
  return dbArrayAddTx<typeof Prisma.AlbumScalarFieldEnum>(
    txClient,
    userId,
    Prisma.ModelName.Album,
    Prisma.ModelName.Image,
    Prisma.AlbumScalarFieldEnum.imageOrder,
    albumId,
    imageIds
  );
}

export function dbAlbumAddImage(
  userId: string,
  albumId: string,
  imageIds: string | readonly string[]
): Promise<void> {
  return dbArrayAdd<typeof Prisma.AlbumScalarFieldEnum>(
    userId,
    Prisma.ModelName.Album,
    Prisma.ModelName.Image,
    Prisma.AlbumScalarFieldEnum.imageOrder,
    albumId,
    imageIds
  );
}

export function dbAlbumRemoveImageTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  albumId: string,
  imageIds: string | readonly string[]
): Promise<void> {
  return dbArrayRemoveTx<typeof Prisma.AlbumScalarFieldEnum>(
    txClient,
    userId,
    Prisma.ModelName.Album,
    Prisma.ModelName.Image,
    Prisma.AlbumScalarFieldEnum.imageOrder,
    albumId,
    imageIds
  );
}

export function dbAlbumRemoveImage(
  userId: string,
  albumId: string,
  imageIds: string | readonly string[]
): Promise<void> {
  return dbArrayRemove<typeof Prisma.AlbumScalarFieldEnum>(
    userId,
    Prisma.ModelName.Album,
    Prisma.ModelName.Image,
    Prisma.AlbumScalarFieldEnum.imageOrder,
    albumId,
    imageIds
  );
}

export function dbAlbumRemoveAllImages(
  userId: string,
  albumId: string
): Promise<void> {
  return dbArrayRemoveAll<typeof Prisma.AlbumScalarFieldEnum>(
    userId,
    Prisma.ModelName.Album,
    Prisma.ModelName.Image,
    Prisma.AlbumScalarFieldEnum.imageOrder,
    albumId
  );
}

export function dbAlbumMoveImageBefore(
  userId: string,
  albumId: string,
  imageId: string,
  referenceImageId?: string | null
): Promise<void> {
  return dbArrayReorder<typeof Prisma.AlbumScalarFieldEnum>(
    userId,
    Prisma.ModelName.Album,
    Prisma.AlbumScalarFieldEnum.imageOrder,
    albumId,
    dbArrayCreateMoveBeforeReorderCallback(imageId, referenceImageId ?? null)
  );
}

export function dbAlbumSortImages<T extends ImageSortableAlbum>(album: T): T {
  dbArraySort(album.images, album.imageOrder);
  return album;
}

export async function dbAlbumGetImages(
  userId: string,
  albumId: string,
  includeFiles?: false
): Promise<Image[]>;

export async function dbAlbumGetImages(
  userId: string,
  albumId: string,
  includeFiles: true
): Promise<(Image & { files: ImageFile[] })[]>;

export async function dbAlbumGetImages(
  userId: string,
  albumId: string,
  includeFiles = false
) {
  const album = await client.album.findFirst({
    where: {
      id: albumId,
      userId,
    },
    select: {
      imageOrder: true,
      images: {
        include: {
          files: includeFiles || false,
        },
      },
    },
  });
  if (!album) {
    throw new Error(
      `dbAlbumGetImages: album not found (userId=${userId}, albumId=${albumId})`
    );
  }
  return dbAlbumSortImages(album).images;
}
