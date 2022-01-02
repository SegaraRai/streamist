import type { ImageFile } from '@prisma/client';
import { dbArrayDeserializeItemIds } from '$shared/dbArray';
import { HTTPError } from '$/utils/httpError';
import { dbDeletionAddTx } from './resource';
import type { TransactionalPrismaClient } from './types';

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
export async function dbImageDeleteByImageOrderTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  imageOrder: string
): Promise<ImageFile[]> {
  const imageIds = dbArrayDeserializeItemIds(imageOrder);
  if (imageIds.length === 0) {
    return [];
  }

  const imageFiles = await txClient.imageFile.findMany({
    where: {
      imageId: {
        in: imageIds,
      },
      userId,
    },
  });

  // ImageFiles will be cascade deleted here
  const imageDeleteResult = await txClient.image.deleteMany({
    where: {
      id: {
        in: imageIds,
      },
    },
  });
  if (imageDeleteResult.count !== imageIds.length) {
    throw new HTTPError(409, 'Images changed during deletion of images');
  }

  await dbDeletionAddTx(txClient, userId, 'image', imageIds);

  return imageFiles;
}
