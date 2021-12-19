import { generateAlbumId } from '$shared-server/generateId';
import { is } from '$shared/is';
import type { DeletionEntityType } from '$shared/types/db';
import type { Album } from '$prisma/client';
import { client } from '$/db/lib/client';
import { updateUserResourceTimestamp } from '$/db/resource';
import { HTTPError } from '$/utils/httpError';

export function getAlbums(userId: string, artistId?: string): Promise<Album[]> {
  return client.album.findMany({
    where: {
      userId,
      artistId,
    },
    include: {
      images: true,
    },
  });
}

export async function createAlbum(
  userId: string,
  title: string,
  artistId: string
): Promise<Album> {
  const artist = await client.artist.findFirst({
    where: {
      id: artistId,
      userId,
    },
  });
  if (!artist) {
    throw new HTTPError(400, `Artist ${artistId} not found`);
  }

  const album = await client.album.create({
    data: {
      id: await generateAlbumId(),
      title,
      userId,
      artistId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  });

  await updateUserResourceTimestamp(userId);

  return album;
}

export async function updateAlbum(
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

  await updateUserResourceTimestamp(userId);
}

export async function deleteAlbum(
  userId: string,
  albumId: string
): Promise<void> {
  // fails if album has coArtists, (images?) or tracks
  // TODO: delete images (and tracks?)
  await client.$transaction(async (txClient) => {
    const deleted = await txClient.album.deleteMany({
      where: {
        id: albumId,
        userId,
      },
    });
    if (deleted.count === 0) {
      throw new HTTPError(404, `Album ${albumId} not found`);
    }
    await txClient.deletion.create({
      data: {
        entityType: is<DeletionEntityType>('album'),
        entityId: albumId,
        userId,
        deletedAt: Date.now(),
      },
    });
  });
  await updateUserResourceTimestamp(userId);
}
