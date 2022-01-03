import { client } from '$/db/lib/client';
import { dbImageDeleteByImageOrderTx, dbImageDeleteTx } from '$/db/lib/image';
import { dbDeletionAddTx, dbResourceUpdateTimestamp } from '$/db/lib/resource';
import {
  dbPlaylistMoveImageBefore,
  dbPlaylistRemoveImageTx,
} from '$/db/playlist';
import { HTTPError } from '$/utils/httpError';
import { imageDeleteFilesAndSourceFiles } from './images';

export async function playlistDelete(
  userId: string,
  playlistId: string,
  skipUpdateTimestamp = false
): Promise<void> {
  const images = await client.$transaction(async (txClient) => {
    // delete images
    const playlist = await txClient.playlist.findFirst({
      where: {
        id: playlistId,
        userId,
      },
      select: {
        imageOrder: true,
      },
    });
    if (!playlist) {
      throw new HTTPError(404, `Playlist ${playlistId} not found`);
    }

    const images = await dbImageDeleteByImageOrderTx(
      txClient,
      userId,
      playlist.imageOrder
    );

    // delete playlist
    // * Playlist id is referenced from: Image (implicit m:n)
    // TODO(db): set ON DELETE RESTRICT for Image (implicit m:n) table
    const result = await txClient.playlist.deleteMany({
      where: {
        id: playlistId,
        imageOrder: playlist.imageOrder,
        userId,
      },
    });
    if (result.count === 0) {
      throw new HTTPError(
        409,
        `Images are modified during deletion of playlist ${playlistId}`
      );
    }

    await dbDeletionAddTx(txClient, userId, 'playlist', playlistId);

    return images;
  });

  await imageDeleteFilesAndSourceFiles(userId, images, true);

  // update resource timestamp
  if (!skipUpdateTimestamp) {
    await dbResourceUpdateTimestamp(userId);
  }
}

export async function playlistImageMoveBefore(
  userId: string,
  playlistId: string,
  imageId: string,
  referenceImageId: string | undefined
): Promise<void> {
  await dbPlaylistMoveImageBefore(
    userId,
    playlistId,
    imageId,
    referenceImageId
  );
  await dbResourceUpdateTimestamp(userId);
}

export async function playlistImageDelete(
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