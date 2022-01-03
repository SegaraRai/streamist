import { dbAlbumMoveImageBefore, dbAlbumRemoveImageTx } from '$/db/album';
import { client } from '$/db/lib/client';
import { dbImageDeleteByImageOrderTx, dbImageDeleteTx } from '$/db/lib/image';
import { dbDeletionAddTx, dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { HTTPError } from '$/utils/httpError';
import { imageDeleteFilesAndSourceFiles } from './images';

export async function albumUpdate(
  userId: string,
  albumId: string,
  title: string
) {
  await client.album.updateMany({
    where: {
      id: albumId,
      userId,
    },
    data: {
      title,
      updatedAt: Date.now(),
    },
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
