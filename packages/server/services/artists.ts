import { dbArtistMoveImageBefore, dbArtistRemoveImageTx } from '$/db/artist';
import { client } from '$/db/lib/client';
import { dbImageDeleteByImageOrderTx, dbImageDeleteTx } from '$/db/lib/image';
import { dbDeletionAddTx, dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { HTTPError } from '$/utils/httpError';
import { imageDeleteFilesAndSourceFiles } from './images';

/**
 * 指定されたアーティストが参照されていない場合に削除する
 *
 * @description
 * - 確認する参照元: Album, Track, AlbumCoArtist, TrackCoArtist
 * - 同時に削除するもの: Image, ImageFile, 画像ファイル(S3)
 * ! 本メソッドは更新日時を更新する（削除時のみ） \
 * ! 本メソッドは削除記録を追加する（削除時のみ）
 * @param userId
 * @param artistId
 * @returns 削除されたら`true`、まだ参照されている場合は`false`
 */
export async function artistDeleteIfUnreferenced(
  userId: string,
  artistId: string,
  skipUpdateTimestamp = false
): Promise<boolean> {
  // Album, Track, AlbumCoArtist, TrackCoArtistから参照されていないか確認
  // 短絡評価を活用するため、より頻繁に参照されていそうなもの順にしておく
  {
    const query = { where: { artistId, userId } } as const;
    const count =
      (await client.album.count(query)) ||
      (await client.track.count(query)) ||
      (await client.albumCoArtist.count(query)) ||
      (await client.trackCoArtist.count(query));
    if (count > 0) {
      return false;
    }
  }

  const images = await client.$transaction(async (txClient) => {
    // delete images
    const artist = await txClient.artist.findFirst({
      where: {
        id: artistId,
        userId,
      },
      select: {
        imageOrder: true,
      },
    });
    if (!artist) {
      throw new HTTPError(404, `Artist ${artistId} not found`);
    }

    const images = await dbImageDeleteByImageOrderTx(
      txClient,
      userId,
      artist.imageOrder
    );

    // delete artist
    // * Artist id is referenced from: Album, AlbumCoArtist, Track, TrackCoArtist, Image (implicit m:n)
    // TODO(db): set ON DELETE RESTRICT for Album, AlbumCoArtist, Track, TrackCoArtist, Image (implicit m:n) table
    const result = await txClient.artist.deleteMany({
      where: {
        id: artistId,
        imageOrder: artist.imageOrder,
        userId,
      },
    });
    if (result.count === 0) {
      throw new HTTPError(
        409,
        `Images are modified during deletion of artist ${artistId}`
      );
    }
    await dbDeletionAddTx(txClient, userId, 'artist', artistId);

    return images;
  });

  await imageDeleteFilesAndSourceFiles(userId, images, true);

  // update resource timestamp
  if (!skipUpdateTimestamp) {
    await dbResourceUpdateTimestamp(userId);
  }

  return true;
}

export async function artistImageMoveBefore(
  userId: string,
  artistId: string,
  imageId: string,
  referenceImageId: string | undefined
): Promise<void> {
  await dbArtistMoveImageBefore(userId, artistId, imageId, referenceImageId);
  await dbResourceUpdateTimestamp(userId);
}

export async function artistImageDelete(
  userId: string,
  artistId: string,
  imageIds: string | readonly string[]
): Promise<void> {
  const images = await client.$transaction(async (txClient) => {
    await dbArtistRemoveImageTx(txClient, userId, artistId, imageIds);
    return dbImageDeleteTx(txClient, userId, imageIds);
  });
  await imageDeleteFilesAndSourceFiles(userId, images, true);
  await dbResourceUpdateTimestamp(userId);
}
