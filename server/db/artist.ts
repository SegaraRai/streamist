import { expectType } from 'tsd';
import { client } from './lib/client';
import type { TransactionalPrismaClient } from './lib/types';
import { Artist, Prisma } from '$prisma/client';
import { generateArtistId } from '$/utils/id';

// check types for `dbArtistGetOrCreateByNameTx`
/* #__PURE__ */ expectType<'Artist'>(Prisma.ModelName.Artist);
/* #__PURE__ */ expectType<'id'>(Prisma.ArtistScalarFieldEnum.id);
/* #__PURE__ */ expectType<'name'>(Prisma.ArtistScalarFieldEnum.name);
/* #__PURE__ */ expectType<'userId'>(Prisma.ArtistScalarFieldEnum.userId);

export async function dbArtistGetOrCreateByNameTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  artistName: string,
  newArtistIdPromise: string | Promise<string> = generateArtistId()
): Promise<Artist> {
  const newArtistId = await newArtistIdPromise;

  // TODO: manually set createdAt and updatedAt (for SQLite)?
  const inserted = await txClient.$executeRaw`
    INSERT INTO Artist (id, name, userId)
    SELECT ${newArtistId}, ${artistName}, ${userId}
      WHERE NOT EXISTS (
        SELECT 1
          FROM Artist
          WHERE userId = ${userId} AND name = ${artistName}
      )
      LIMIT 1
    `;
  if (inserted !== 1) {
    throw new Error(
      `dbArtistGetOrCreateByNameTx: failed to INSERT (userId=${userId}, artistName=${artistName})`
    );
  }

  const artist = await txClient.artist.findFirst({
    where: {
      name: artistName,
      userId,
    },
  });
  if (!artist) {
    // should not occur
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
