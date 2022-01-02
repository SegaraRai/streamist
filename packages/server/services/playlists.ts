import { client } from '$/db/lib/client';
import { dbImageDeleteTx } from '$/db/lib/image';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { dbPlaylistRemoveImageTx } from '$/db/playlist';
import { imageDeleteFilesAndSourceFiles } from './images';

export async function playlistRemoveImages(
  userId: string,
  playlistId: string,
  imageIds: string | readonly string[]
): Promise<void> {
  const images = await client.$transaction(async (txClient) => {
    await dbPlaylistRemoveImageTx(txClient, userId, playlistId, imageIds);
    return dbImageDeleteTx(txClient, userId, imageIds);
  });
  await imageDeleteFilesAndSourceFiles(userId, images, true);
  await dbResourceUpdateTimestamp(userId);
}
