import { Playlist } from '@prisma/client';
import { generatePlaylistId } from '$shared-server/generateId';
import { dbArraySerializeItemIds } from '$shared/dbArray';
import { toUnique } from '$shared/unique';
import { client } from '$/db/lib/client';
import { dbImageDeleteByImageOrderTx, dbImageDeleteTx } from '$/db/lib/image';
import { dbDeletionAddTx, dbResourceUpdateTimestamp } from '$/db/lib/resource';
import {
  dbPlaylistAddTrack,
  dbPlaylistMoveImageBefore,
  dbPlaylistMoveTrackBefore,
  dbPlaylistRemoveImageTx,
  dbPlaylistRemoveTrack,
} from '$/db/playlist';
import { imageDeleteFilesAndSourceFiles } from '$/services/images';
import { HTTPError } from '$/utils/httpError';
import type { IPlaylistCreateData, IPlaylistUpdateData } from '$/validators';

export async function playlistCreate(
  userId: string,
  data: IPlaylistCreateData
): Promise<Playlist> {
  const { title, description } = data;

  const trackIds = data.trackIds || [];
  if (toUnique(trackIds).length !== trackIds.length) {
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

  const timestamp = Date.now();

  const playlist = await client.playlist.create({
    data: {
      id: await generatePlaylistId(),
      title,
      description,
      createdAt: timestamp,
      updatedAt: timestamp,
      trackOrder: dbArraySerializeItemIds(trackIds),
      tracks: {
        create: trackIds.map((trackId) => ({ y: String(trackId), userId })),
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
  data: IPlaylistUpdateData
): Promise<void> {
  const { description, title } = data;

  if (description === undefined && title === undefined) {
    return;
  }

  const playlist = await client.playlist.updateMany({
    where: {
      id: playlistId,
      userId,
    },
    data: {
      title,
      description,
      updatedAt: Date.now(),
    },
  });
  if (playlist.count === 0) {
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

export async function playlistTrackAdd(
  userId: string,
  playlistId: string,
  trackIds: readonly string[]
): Promise<void> {
  await dbPlaylistAddTrack(userId, playlistId, trackIds);
  await dbResourceUpdateTimestamp(userId);
}

export async function playlistTrackMoveBefore(
  userId: string,
  playlistId: string,
  trackId: string,
  nextTrackId: string | null
): Promise<void> {
  await dbPlaylistMoveTrackBefore(
    userId,
    playlistId,
    trackId,
    nextTrackId || undefined
  );
  await dbResourceUpdateTimestamp(userId);
}

export async function playlistTrackRemove(
  userId: string,
  playlistId: string,
  trackIds: readonly string[]
): Promise<void> {
  await dbPlaylistRemoveTrack(userId, playlistId, trackIds);
  await dbResourceUpdateTimestamp(userId);
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
