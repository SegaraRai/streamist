import { AlbumCoArtist, Prisma } from '@prisma/client';
import PQueue from 'p-queue';
import {
  generateAlbumCoArtistId,
  generateArtistId,
} from '$shared-server/generateId';
import { emptyToNull } from '$shared/transform';
import { dbAlbumMoveImageBefore, dbAlbumRemoveImageTx } from '$/db/album';
import { dbArtistCreateCachedGetOrCreateByNameTx } from '$/db/artist';
import { client } from '$/db/lib/client';
import { dbCoArtistMergeTx } from '$/db/lib/coArtist';
import { dbImageDeleteByImageOrderTx, dbImageDeleteTx } from '$/db/lib/image';
import { dbDeletionAddTx, dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { dbGetTimestamp } from '$/db/lib/timestamp';
import { artistDeleteIfUnreferenced } from '$/services/artists';
import { imageDeleteFilesAndSourceFiles } from '$/services/images';
import { HTTPError } from '$/utils/httpError';
import type { IAlbumUpdateData } from '$/validators';

export interface UpdateAlbumOptions {
  readonly forceNewArtist?: boolean;
}

export async function albumUpdate(
  userId: string,
  albumId: string,
  data: IAlbumUpdateData,
  { forceNewArtist = false }: UpdateAlbumOptions
): Promise<void> {
  const [oldAlbum, newAlbum] = await client.$transaction(async (txClient) => {
    const timestamp = dbGetTimestamp();

    const artistGetOrCreateTx = dbArtistCreateCachedGetOrCreateByNameTx(
      txClient,
      userId
    );

    const album = await txClient.album.findFirst({
      where: {
        id: albumId,
        userId,
      },
    });
    if (!album) {
      throw new HTTPError(404, `album ${albumId} not found`);
    }

    // create artist
    let artistId: string | undefined;
    if (data.artistId) {
      const artist = await txClient.artist.findFirst({
        where: {
          id: data.artistId,
          userId,
        },
        select: {
          id: true,
        },
      });
      if (!artist) {
        throw new HTTPError(400, `Artist ${data.artistId} not found`);
      }
      artistId = artist.id;
    } else if (data.artistName) {
      const artist = forceNewArtist
        ? await txClient.artist.create({
            data: {
              id: await generateArtistId(),
              name: data.artistName,
              userId,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
            select: {
              id: true,
            },
          })
        : await artistGetOrCreateTx(data.artistName);
      artistId = artist.id;
    }

    // update coArtists
    if (data.coArtists) {
      if (data.coArtists.remove?.length) {
        const coArtists = await txClient.albumCoArtist.findMany({
          where: {
            OR: data.coArtists.remove.map(({ artistId, role }) => ({
              artistId,
              role,
            })),
            AND: {
              albumId,
              userId,
            },
          },
        });
        const coArtistIds = coArtists.map((coArtist) => coArtist.id);
        const deleted = await txClient.albumCoArtist.deleteMany({
          where: {
            id: {
              in: coArtistIds,
            },
          },
        });
        if (deleted.count !== coArtistIds.length) {
          throw new HTTPError(409, 'coArtists was deleted during album update');
        }
        await dbDeletionAddTx(txClient, userId, 'albumCoArtist', coArtistIds);
      }
      if (data.coArtists.add?.length) {
        const queue = new PQueue({ concurrency: 1 });
        const resolvedCoArtists = await Promise.all(
          data.coArtists.add
            .filter(({ artistName, artistId }) => artistName || artistId)
            .map(({ artistName, artistId, role }) =>
              queue.add(async () =>
                artistId
                  ? { role, artistId }
                  : {
                      role,
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      artistId: (await artistGetOrCreateTx(artistName!)).id,
                    }
              )
            )
        );
        const newCoArtists: AlbumCoArtist[] = await Promise.all(
          resolvedCoArtists.map(async ({ role, artistId }) => ({
            id: await generateAlbumCoArtistId(),
            albumId,
            userId,
            artistId,
            role,
            createdAt: timestamp,
            updatedAt: timestamp,
          }))
        );
        await txClient.albumCoArtist.createMany({
          data: newCoArtists,
        });
      }
    }

    const newAlbum = await txClient.album.update({
      where: {
        id: albumId,
      },
      data: {
        title: data.title,
        titleSort: emptyToNull(data.titleSort),
        description: data.description,
        artistId,
        updatedAt: timestamp,
      },
    });

    return [album, newAlbum];
  });

  if (newAlbum.artistId !== oldAlbum.artistId) {
    await artistDeleteIfUnreferenced(userId, oldAlbum.artistId, true);
  }

  for (const { artistId } of data.coArtists?.remove ?? []) {
    if (artistId === oldAlbum.artistId) {
      continue;
    }
    await artistDeleteIfUnreferenced(userId, artistId, true);
  }

  await dbResourceUpdateTimestamp(userId);
}

export async function albumMerge(
  userId: string,
  albumId: string,
  toAlbumId: string
): Promise<void> {
  await client.$transaction(async (txClient): Promise<void> => {
    const timestamp = dbGetTimestamp();

    const album = await txClient.album.findFirst({
      where: {
        id: albumId,
        userId,
      },
      select: {
        imageOrder: true,
      },
    });

    if (!album) {
      throw new HTTPError(404, `album ${albumId} not found`);
    }

    const toAlbum = await txClient.album.findFirst({
      where: {
        id: toAlbumId,
        userId,
      },
      select: {
        imageOrder: true,
      },
    });

    if (!toAlbum) {
      throw new HTTPError(404, `album ${toAlbumId} not found`);
    }

    await txClient.track.updateMany({
      where: {
        albumId,
        userId,
      },
      data: {
        albumId: toAlbumId,
        updatedAt: timestamp,
      },
    });

    await dbCoArtistMergeTx<typeof Prisma.AlbumCoArtistScalarFieldEnum>(
      txClient,
      Prisma.ModelName.AlbumCoArtist,
      'albumId',
      userId,
      albumId,
      toAlbumId,
      timestamp
    );

    await txClient.aAlbumImage.updateMany({
      where: {
        x: albumId,
        userId,
      },
      data: {
        x: toAlbumId,
      },
    });

    const updated = await txClient.album.updateMany({
      where: {
        id: toAlbumId,
        imageOrder: toAlbum.imageOrder,
        userId,
      },
      data: {
        updatedAt: timestamp,
        imageOrder: toAlbum.imageOrder + album.imageOrder,
      },
    });
    if (!updated.count) {
      throw new HTTPError(409, `album ${toAlbumId} changed during merge`);
    }

    const deleted = await txClient.album.deleteMany({
      where: {
        id: albumId,
        imageOrder: album.imageOrder,
        userId,
      },
    });
    if (!deleted.count) {
      throw new HTTPError(409, `album ${albumId} changed during merge`);
    }

    await dbDeletionAddTx(txClient, userId, 'album', albumId);
  });

  await dbResourceUpdateTimestamp(userId);
}

/**
 * 指定されたアルバムが参照されていない場合に削除する
 *
 * @description
 * - 確認する参照元: Track
 * - 同時に削除するもの: AlbumCoArtist (via CASCADE), Image, ImageFile, 画像ファイル(S3)
 * ! 本メソッドは更新日時を更新する（削除時のみ） \
 * ! 本メソッドは削除記録を追加する（削除時のみ） \
 * @param userId
 * @param albumId
 * @returns 削除されたらアルバムのアーティストID、まだ参照されている場合は`false`
 */
export async function albumDeleteIfUnreferenced(
  userId: string,
  albumId: string,
  skipUpdateTimestamp = false
): Promise<string | false> {
  // Trackから参照されていないか確認
  {
    const query = { where: { albumId, userId } } as const;
    const count = await client.track.count(query);
    if (count > 0) {
      return false;
    }
  }

  const [artistId, images] = await client.$transaction(async (txClient) => {
    // delete images
    const album = await txClient.album.findFirst({
      where: {
        id: albumId,
        userId,
      },
      select: {
        artistId: true,
        imageOrder: true,
      },
    });
    if (!album) {
      throw new HTTPError(404, `Album ${albumId} not found`);
    }

    const images = await dbImageDeleteByImageOrderTx(
      txClient,
      userId,
      album.imageOrder
    );

    // delete album
    // * Album id is referenced from: Track, AlbumCoArtist, Image (implicit m:n)
    // AlbumCoArtist will be cascade deleted (Deletion of AlbumCoArtist is not recorded, therefore the client must synchronize AlbumCoArtist based on the Deletion of Album)
    const result = await txClient.album.deleteMany({
      where: {
        id: albumId,
        artistId: album.artistId,
        imageOrder: album.imageOrder,
        userId,
      },
    });
    if (result.count === 0) {
      throw new HTTPError(
        409,
        `Images are modified during deletion of album ${albumId}`
      );
    }

    await dbDeletionAddTx(txClient, userId, 'album', albumId);

    return [album.artistId, images] as const;
  });

  await imageDeleteFilesAndSourceFiles(userId, images, true);

  // update resource timestamp
  if (!skipUpdateTimestamp) {
    await dbResourceUpdateTimestamp(userId);
  }

  return artistId;
}

export async function albumImageMoveBefore(
  userId: string,
  albumId: string,
  imageId: string,
  referenceImageId: string | undefined
): Promise<void> {
  await dbAlbumMoveImageBefore(userId, albumId, imageId, referenceImageId);
  await dbResourceUpdateTimestamp(userId);
}

export async function albumImageDelete(
  userId: string,
  albumId: string,
  imageIds: string | readonly string[]
): Promise<void> {
  const images = await client.$transaction(async (txClient) => {
    await dbAlbumRemoveImageTx(txClient, userId, albumId, imageIds);
    return dbImageDeleteTx(txClient, userId, imageIds);
  });
  await imageDeleteFilesAndSourceFiles(userId, images, true);
  await dbResourceUpdateTimestamp(userId);
}
