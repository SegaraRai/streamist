import { Album, Prisma } from '@prisma/client';
import { generateArtistId } from '$shared-server/generateId';
import { emptyToNull } from '$shared/transform';
import { dbAlbumMoveImageBefore, dbAlbumRemoveImageTx } from '$/db/album';
import { dbArtistGetOrCreateByNameTx } from '$/db/artist';
import { client } from '$/db/lib/client';
import { dbCoArtistMergeTx } from '$/db/lib/coArtist';
import { dbImageDeleteByImageOrderTx, dbImageDeleteTx } from '$/db/lib/image';
import { dbDeletionAddTx, dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { HTTPError } from '$/utils/httpError';
import { imageDeleteFilesAndSourceFiles } from './images';

export type AlbumUpdateData = Partial<
  Pick<Album, 'title' | 'titleSort' | 'notes' | 'artistId'>
> & {
  artistName?: string;
};

export interface UpdateAlbumOptions {
  readonly forceNewArtist?: boolean;
}

export async function albumUpdate(
  userId: string,
  albumId: string,
  data: AlbumUpdateData,
  { forceNewArtist = false }: UpdateAlbumOptions
): Promise<void> {
  await client.$transaction(async (txClient) => {
    const timestamp = Date.now();

    const albumCount = await txClient.album.count({
      where: {
        id: albumId,
        userId,
      },
    });
    if (!albumCount) {
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
          })
        : await dbArtistGetOrCreateByNameTx(txClient, userId, data.artistName);
      artistId = artist.id;
    }

    await txClient.album.updateMany({
      where: {
        id: albumId,
        userId,
      },
      data: {
        title: data.title,
        titleSort: emptyToNull(data.titleSort),
        notes: data.notes,
        artistId,
        updatedAt: timestamp,
      },
    });
  });

  await dbResourceUpdateTimestamp(userId);
}

export async function albumMerge(
  userId: string,
  albumId: string,
  toAlbumId: string
): Promise<void> {
  await client.$transaction(async (txClient): Promise<void> => {
    const timestamp = Date.now();

    const album = await txClient.album.findFirst({
      where: {
        id: albumId,
        userId,
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
    // TODO(db): set ON DELETE RESTRICT for Track and Image (implicit m:n) table
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
