import { client } from '$/db/lib/client';
import { HTTPError } from '$/utils/httpError';
import { generateAlbumId } from '$/utils/id';
import type { Album } from '$prisma/client';

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

  return client.album.create({
    data: {
      id: await generateAlbumId(),
      title,
      userId,
      artistId,
    },
  });
}

export function updateAlbum(userId: string, albumId: string, title: string) {
  return client.album.updateMany({
    where: {
      id: albumId,
      userId,
    },
    data: {
      title,
    },
  });
}

export function deleteAlbum(userId: string, albumId: string) {
  // fails if album has images or tracks
  // TODO(db): delete sentinel node of AlbumImage
  return client.album.deleteMany({
    where: {
      id: albumId,
      userId,
    },
  });
}
