import type { Image, ImageFile } from '@prisma/client';
import { dbArrayDeserializeItemIds } from '$shared/dbArray';
import { HTTPError } from '$/utils/httpError';
import { dbDeletionAddTx } from './resource';
import type { TransactionalPrismaClient } from './types';

type DeletedImage = Pick<Image, 'id' | 'sourceFileId'> & {
  files: Pick<ImageFile, 'id' | 'extension' | 'region'>[];
};

export async function dbImageDeleteTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  imageIds: string | readonly string[]
): Promise<DeletedImage[]> {
  if (typeof imageIds === 'string') {
    imageIds = [imageIds];
  }

  if (imageIds.length === 0) {
    return [];
  }

  const images = await txClient.image.findMany({
    where: {
      id: {
        in: imageIds as string[],
      },
      userId,
    },
    select: {
      id: true,
      sourceFileId: true,
      files: {
        select: {
          id: true,
          extension: true,
          region: true,
        },
      },
    },
  });

  // delete image
  // * Image id is referenced from: ImageFile, Album (implicit m:n), Artist (implicit m:n), Playlist (implicit m:n)
  // * ImageFile id is referenced from: (none)
  // ImageFiles will be cascade deleted here
  const imageDeleteResult = await txClient.image.deleteMany({
    where: {
      id: {
        in: imageIds as string[],
      },
    },
  });
  if (imageDeleteResult.count !== imageIds.length) {
    throw new HTTPError(409, 'Images changed during deletion of images');
  }

  await dbDeletionAddTx(txClient, userId, 'image', imageIds);

  return images;
}

/**
 * Album/Artist/PlaylistのimageOrderを元に画像を削除する \
 * imageOrderについては削除時に比較して楽観ロックを実装すること
 *
 * @description
 * ! 本メソッドは削除記録を追加する（削除時のみ） \
 *
 * @param txClient
 * @param userId
 * @param imageOrder
 * @returns ImageFileの配列（S3からの削除用）
 */
export function dbImageDeleteByImageOrderTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  imageOrder: string
): Promise<DeletedImage[]> {
  return dbImageDeleteTx(
    txClient,
    userId,
    dbArrayDeserializeItemIds(imageOrder)
  );
}
