import { client } from '$/db/lib/client';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { dbGetTimestamp } from '$/db/lib/timestamp';
import { osDeleteSourceFiles } from '$/os/sourceFile';
import { HTTPError } from '$/utils/httpError';

/**
 * 指定したSourceFileが参照されていない場合に実体をS3から削除する \
 * SourceFileのレコード自体は現状削除しない（entityExistsカラムはfalseに更新する）
 * @param userId
 * @param sourceFileId
 * @param skipUpdateTimestamp
 */
export async function sourceFileDeleteFromOSIfUnreferenced(
  userId: string,
  sourceFileId: string,
  skipUpdateTimestamp = false
): Promise<boolean> {
  // Track, Imageから参照されていないか確認
  // 短絡評価を活用するため、より頻繁に参照されていそうなもの順にしておく
  {
    const extractedSourceFiles = await client.sourceFile.findMany({
      where: { sourceFileId, userId },
      select: { id: true },
    });
    const query = {
      where: {
        sourceFileId: {
          in: [
            sourceFileId,
            ...extractedSourceFiles.map((sourceFile) => sourceFile.id),
          ] as string[],
        },
        userId,
      },
    } as const;
    const count =
      (await client.track.count(query)) || (await client.image.count(query));
    if (count > 0) {
      return false;
    }
  }

  const sourceFile = await client.sourceFile.findFirst({
    where: {
      id: sourceFileId,
      userId,
    },
    select: {
      id: true,
      region: true,
      entityExists: true,
      sourceId: true,
      userId: true,
    },
  });

  if (!sourceFile) {
    throw new HTTPError(404, `SourceFile ${sourceFileId} does not exist`);
  }

  if (!sourceFile.entityExists) {
    return true;
  }

  const updated = await client.sourceFile.updateMany({
    where: {
      id: sourceFileId,
      entityExists: true,
      userId,
    },
    data: {
      entityExists: false,
      updatedAt: dbGetTimestamp(),
    },
  });

  if (updated.count === 0) {
    return true;
  }

  if (!skipUpdateTimestamp) {
    await dbResourceUpdateTimestamp(userId);
  }

  // delete source files from S3
  await osDeleteSourceFiles([sourceFile]);

  return true;
}
