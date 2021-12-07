import {
  ALBUM_IMAGE_SENTINEL_NODE_IMAGE_ID,
  PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID,
} from '$shared/dbConfig';
import { is } from '$shared/is';
import type { SourceState, TransactionalPrismaClient } from './types';

export async function dbInitSentinel(
  txClient: TransactionalPrismaClient
): Promise<void> {
  const userId = '/';
  const artistId = '/';
  const albumId = '/';
  const sourceId = '/';

  await txClient.user.create({
    data: {
      id: userId,
      name: '.sentinel',
      email: 'sentinel@example.org',
    },
  });

  await txClient.source.create({
    data: {
      id: sourceId,
      state: is<SourceState>('transcoded'),
      userId,
    },
  });

  await txClient.artist.create({
    data: {
      id: artistId,
      name: '.sentinel',
      userId,
    },
  });

  await txClient.album.create({
    data: {
      id: albumId,
      title: '.sentinel',
      userId,
      artistId,
    },
  });

  await txClient.track.create({
    data: {
      id: PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID,
      title: '.sentinel',
      discNumber: 1,
      trackNumber: 1,
      duration: 1,
      userId,
      artistId,
      albumId,
      sourceId,
    },
  });

  await txClient.image.create({
    data: {
      id: ALBUM_IMAGE_SENTINEL_NODE_IMAGE_ID,
      sourceWidth: 1,
      sourceHeight: 1,
      dHash: '',
      sourceId,
      userId,
    },
  });
}
