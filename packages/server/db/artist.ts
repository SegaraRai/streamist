import { expectType } from 'tsd';
import { generateArtistId } from '$shared-server/generateId';
import { dbArraySort } from '$shared/dbArray';
import { Artist, Image, ImageFile, Prisma } from '$prisma/client';
import {
  dbArrayAddTx,
  dbArrayCreateMoveBeforeReorderCallback,
  dbArrayRemoveTx,
  dbArrayReorder,
} from './lib/array';
import { client } from './lib/client';
import type { TransactionalPrismaClient } from './lib/types';

export type ImageSortableArtist = { imageOrder: string; images: Image[] };

// check types for `dbArtistGetOrCreateByNameTx`
/* #__PURE__ */ expectType<'Artist'>(Prisma.ModelName.Artist);
/* #__PURE__ */ expectType<'id'>(Prisma.ArtistScalarFieldEnum.id);
/* #__PURE__ */ expectType<'name'>(Prisma.ArtistScalarFieldEnum.name);
/* #__PURE__ */ expectType<'userId'>(Prisma.ArtistScalarFieldEnum.userId);
/* #__PURE__ */ expectType<'createdAt'>(Prisma.ArtistScalarFieldEnum.createdAt);
/* #__PURE__ */ expectType<'updatedAt'>(Prisma.ArtistScalarFieldEnum.updatedAt);

export async function dbArtistGetOrCreateByNameTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  artistName: string,
  newArtistIdPromise: string | Promise<string> = generateArtistId()
): Promise<Artist> {
  const newArtistId = await newArtistIdPromise;

  const createdAt = Date.now();

  // NOTE: DO NOT check inserted row count. it's ok if it's 0.
  await txClient.$executeRaw`
    INSERT INTO Artist (id, name, userId, createdAt, updatedAt)
    SELECT ${newArtistId}, ${artistName}, ${userId}, ${createdAt}, ${createdAt}
      WHERE NOT EXISTS (
        SELECT 1
          FROM Artist
          WHERE userId = ${userId} AND name = ${artistName}
      )
      LIMIT 1
    `;

  const artist = await txClient.artist.findFirst({
    where: {
      name: artistName,
      userId,
    },
  });
  if (!artist) {
    // should rarely happen
    throw new Error(
      `dbArtistGetOrCreateByNameTx: failed to get (userId=${userId}, artistName=${artistName})`
    );
  }

  return artist;
}

export async function dbArtistGetOrCreateByName(
  userId: string,
  artistName: string,
  newArtistIdPromise: string | Promise<string> = generateArtistId()
): Promise<Artist> {
  // resolve Promise in advance to reduce transaction processing time
  const newArtistId = await newArtistIdPromise;
  return client.$transaction(
    (txClient): Promise<Artist> =>
      dbArtistGetOrCreateByNameTx(txClient, userId, artistName, newArtistId)
  );
}

export function dbArtistAddImageTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  artistId: string,
  imageIds: string | readonly string[],
  prepend = false
): Promise<void> {
  return dbArrayAddTx<typeof Prisma.ArtistScalarFieldEnum>(
    txClient,
    userId,
    Prisma.ModelName.Artist,
    Prisma.ModelName.Image,
    Prisma.ArtistScalarFieldEnum.imageOrder,
    artistId,
    imageIds,
    prepend
  );
}

export function dbArtistRemoveImageTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  artistId: string,
  imageIds: string | readonly string[]
): Promise<void> {
  return dbArrayRemoveTx<typeof Prisma.ArtistScalarFieldEnum>(
    txClient,
    userId,
    Prisma.ModelName.Artist,
    Prisma.ModelName.Image,
    Prisma.ArtistScalarFieldEnum.imageOrder,
    artistId,
    imageIds
  );
}

export function dbArtistMoveImageBefore(
  userId: string,
  artistId: string,
  imageId: string,
  referenceImageId?: string | null
): Promise<void> {
  return dbArrayReorder<typeof Prisma.ArtistScalarFieldEnum>(
    userId,
    Prisma.ModelName.Artist,
    Prisma.ArtistScalarFieldEnum.imageOrder,
    artistId,
    dbArrayCreateMoveBeforeReorderCallback(imageId, referenceImageId ?? null)
  );
}

export function dbArtistSortImages<T extends ImageSortableArtist>(
  artist: T
): T {
  dbArraySort(artist.images, artist.imageOrder);
  return artist;
}

export async function dbArtistGetImages(
  userId: string,
  artistId: string
): Promise<(Image & { files: ImageFile[] })[]> {
  const artist = await client.artist.findFirst({
    where: {
      id: artistId,
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
  if (!artist) {
    throw new Error(
      `dbArtistGetImages: artist not found (userId=${userId}, artistId=${artistId})`
    );
  }
  return dbArtistSortImages(artist).images;
}
