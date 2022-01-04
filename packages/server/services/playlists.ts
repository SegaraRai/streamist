import { Playlist } from '@prisma/client';
import { generatePlaylistId } from '$shared-server/generateId';
import { dbArraySerializeItemIds } from '$shared/dbArray';
import { client } from '$/db/lib/client';
import { dbImageDeleteByImageOrderTx, dbImageDeleteTx } from '$/db/lib/image';
import { dbDeletionAddTx, dbResourceUpdateTimestamp } from '$/db/lib/resource';
import {
  dbPlaylistMoveImageBefore,
  dbPlaylistRemoveImageTx,
} from '$/db/playlist';
import { HTTPError } from '$/utils/httpError';
import { imageDeleteFilesAndSourceFiles } from './images';

export async function playlistCreate(
  userId: string,
  data: Pick<Playlist, 'title' | 'notes'> & { trackIds?: string[] }
): Promise<Playlist> {
  const trackIds = data.trackIds || [];
  if (Array.from(new Set(trackIds)).length !== trackIds.length) {
    throw new HTTPError(400, 'trackIds must be unique');
  }

  // トラックが存在するか確認
  // NOTE(security): ここでトラックの所有者を確認している
  // 存在しないトラックについてはconnectの段階でエラーになるので実は確認しなくても良いが、他のユーザーのトラックが指定できると問題なので
  const trackCount = await client.track.count({
    where: {
      id: {
        in: trackIds,
      },
      userId,
    },
  });
  if (trackCount !== trackIds.length) {
    throw new HTTPError(400, 'some trackIds are not found');
  }

  const playlist = await client.playlist.create({
    data: {
      id: await generatePlaylistId(),
      title: String(data.title),
      notes: String(data.notes),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      trackOrder: dbArraySerializeItemIds(trackIds),
      tracks: {
        connect: trackIds.map((trackId) => ({ id: String(trackId) })),
      },
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });

  await dbResourceUpdateTimestamp(userId);

  return playlist;
}

export async function playlistUpdate(
  userId: string,
  playlistId: string,
  data: Partial<Pick<Playlist, 'title' | 'notes'>>
): Promise<void> {
  if (data.title == null && data.notes == null) {
    return;
  }

  if (data.title != null && !data.title.trim()) {
    throw new HTTPError(400, 'title must not be empty');
  }

  const newPlaylist = await client.playlist.updateMany({
    where: {
      id: playlistId,
      userId,
    },
    data: {
      title: data.title?.trim(),
      notes: data.notes?.trim(),
      updatedAt: Date.now(),
    },
  });
  if (newPlaylist.count === 0) {
    throw new HTTPError(404, `Playlist ${playlistId} not found`);
  }

  await dbResourceUpdateTimestamp(userId);
}

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
