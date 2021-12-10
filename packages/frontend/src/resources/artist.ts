import { db } from '~/db';
import type { Artist } from '$prisma/client';

export async function fetchArtist(artistId: string): Promise<Artist> {
  const artist = await db.artists.get(artistId);
  if (!artist) {
    throw new Error(`Artist ${artistId} not found`);
  }
  return artist;
}
