import { expectType } from 'tsd';
import { Album, Image, Prisma } from '$prisma/client';
import { generateAlbumId } from '$/utils/id';
import { client } from './lib/client';
import { ALBUM_IMAGE_SENTINEL_NODE_IMAGE_ID } from './lib/config';
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

// check types for `dbAlbumGetOrCreateByNameTx`
/* #__PURE__ */ expectType<'Album'>(Prisma.ModelName.Album);
/* #__PURE__ */ expectType<'id'>(Prisma.AlbumScalarFieldEnum.id);
/* #__PURE__ */ expectType<'title'>(Prisma.AlbumScalarFieldEnum.title);
/* #__PURE__ */ expectType<'artistId'>(Prisma.AlbumScalarFieldEnum.artistId);
/* #__PURE__ */ expectType<'userId'>(Prisma.AlbumScalarFieldEnum.userId);

export async function dbAlbumCreateTx(
  txClient: TransactionalPrismaClient,
  data: Prisma.AlbumCreateArgs['data'] & { userId: string }
): Promise<Album> {
  const album = await txClient.album.create({ data });

  // create sentinel
  await txClient.albumImage.create({
    data: {
      userId: data.userId,
      albumId: data.id,
      imageId: ALBUM_IMAGE_SENTINEL_NODE_IMAGE_ID,
      nextImageId: null,
    },
  });

  return album;
}

export function dbAlbumCreate(
  data: Prisma.AlbumCreateArgs['data'] & { userId: string }
): Promise<Album> {
  return client.$transaction(
    (txClient): Promise<Album> => dbAlbumCreateTx(txClient, data)
  );
}

export async function dbAlbumGetOrCreateByNameTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  artistId: string,
  albumTitle: string,
  newAlbumIdPromise: string | Promise<string> = generateAlbumId()
): Promise<Album> {
  const newAlbumId = await newAlbumIdPromise;

  // TODO: manually set createdAt and updatedAt?
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

  // create sentinel
  if (album.id === newAlbumId) {
    await txClient.albumImage.create({
      data: {
        userId: userId,
        albumId: album.id,
        imageId: ALBUM_IMAGE_SENTINEL_NODE_IMAGE_ID,
        nextImageId: null,
      },
    });
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
  imageId: string
): Promise<void> {
  return dbLinkedListAppendTx<typeof Prisma.AlbumImageScalarFieldEnum>(
    txClient,
    Prisma.ModelName.AlbumImage,
    userId,
    Prisma.AlbumImageScalarFieldEnum.albumId,
    albumId,
    Prisma.AlbumImageScalarFieldEnum.imageId,
    Prisma.AlbumImageScalarFieldEnum.nextImageId,
    imageId
  );
}

export function dbAlbumAddImage(
  userId: string,
  albumId: string,
  imageId: string
): Promise<void> {
  return dbLinkedListAppend<typeof Prisma.AlbumImageScalarFieldEnum>(
    Prisma.ModelName.AlbumImage,
    userId,
    Prisma.AlbumImageScalarFieldEnum.albumId,
    albumId,
    Prisma.AlbumImageScalarFieldEnum.imageId,
    Prisma.AlbumImageScalarFieldEnum.nextImageId,
    imageId
  );
}

export function dbAlbumRemoveImageTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  albumId: string,
  imageId: string
): Promise<void> {
  return dbLinkedListRemoveTx<typeof Prisma.AlbumImageScalarFieldEnum>(
    txClient,
    Prisma.ModelName.AlbumImage,
    userId,
    Prisma.AlbumImageScalarFieldEnum.albumId,
    albumId,
    Prisma.AlbumImageScalarFieldEnum.imageId,
    Prisma.AlbumImageScalarFieldEnum.nextImageId,
    imageId
  );
}

export function dbAlbumRemoveImage(
  userId: string,
  albumId: string,
  imageId: string
): Promise<void> {
  return dbLinkedListRemove<typeof Prisma.AlbumImageScalarFieldEnum>(
    Prisma.ModelName.AlbumImage,
    userId,
    Prisma.AlbumImageScalarFieldEnum.albumId,
    albumId,
    Prisma.AlbumImageScalarFieldEnum.imageId,
    Prisma.AlbumImageScalarFieldEnum.nextImageId,
    imageId
  );
}

export async function dbAlbumRemoveAllImages(
  userId: string,
  albumId: string
): Promise<void> {
  await dbLinkedListRemoveAll<typeof Prisma.AlbumImageScalarFieldEnum>(
    Prisma.ModelName.AlbumImage,
    userId,
    Prisma.AlbumImageScalarFieldEnum.albumId,
    albumId,
    Prisma.AlbumImageScalarFieldEnum.imageId,
    Prisma.AlbumImageScalarFieldEnum.nextImageId,
    ALBUM_IMAGE_SENTINEL_NODE_IMAGE_ID
  );
}

export async function dbAlbumMoveImageBefore(
  userId: string,
  albumId: string,
  imageId: string,
  referenceImageId?: string
): Promise<void> {
  if (
    imageId === ALBUM_IMAGE_SENTINEL_NODE_IMAGE_ID ||
    referenceImageId === ALBUM_IMAGE_SENTINEL_NODE_IMAGE_ID
  ) {
    throw new Error('invalid parameter');
  }
  if (!referenceImageId) {
    // insert into front
    referenceImageId = ALBUM_IMAGE_SENTINEL_NODE_IMAGE_ID;
  }
  await dbLinkedListMoveBefore<typeof Prisma.AlbumImageScalarFieldEnum>(
    Prisma.ModelName.AlbumImage,
    userId,
    Prisma.AlbumImageScalarFieldEnum.albumId,
    albumId,
    Prisma.AlbumImageScalarFieldEnum.imageId,
    Prisma.AlbumImageScalarFieldEnum.nextImageId,
    imageId,
    referenceImageId
  );
}

export async function dbAlbumGetImages(
  userId: string,
  albumId: string
): Promise<Image[]> {
  return dbLinkedListSort(
    await client.albumImage.findMany({
      where: {
        userId,
        albumId,
      },
      include: {
        image: true,
      },
    }),
    Prisma.AlbumImageScalarFieldEnum.imageId,
    Prisma.AlbumImageScalarFieldEnum.nextImageId,
    ALBUM_IMAGE_SENTINEL_NODE_IMAGE_ID
  ).map((albumImage) => albumImage.image);
}
