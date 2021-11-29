import { client } from './lib/client';
import { dbAlbumGetOrCreateByNameTx } from './album';
import { dbArtistGetOrCreateByNameTx } from './artist';
import { Album, Artist, Track } from '$prisma/client';
import { generateAlbumId, generateArtistId, generateTrackId } from '$/utils/id';

export async function dbTrackCreate(
  userId: string,
  sourceId: string,
  albumTitle: string,
  albumArtistName: string,
  trackTitle: string,
  trackArtistName: string
): Promise<[Track, Artist, Album, Artist]> {
  const isSameArtist = trackArtistName === albumArtistName;

  const albumArtistId = await generateArtistId();
  const albumId = await generateAlbumId();
  const trackArtistId = isSameArtist ? albumArtistId : await generateArtistId();
  const trackId = await generateTrackId();

  return client.$transaction(async (txClient) => {
    const albumArtist = await dbArtistGetOrCreateByNameTx(
      txClient,
      userId,
      albumArtistName,
      albumArtistId
    );

    const album = await dbAlbumGetOrCreateByNameTx(
      txClient,
      userId,
      albumArtistId,
      albumTitle,
      albumId
    );

    const trackArtist = isSameArtist
      ? albumArtist
      : await dbArtistGetOrCreateByNameTx(
          txClient,
          userId,
          trackArtistName,
          trackArtistId
        );

    const track = await txClient.track.create({
      data: {
        id: trackId,
        title: trackTitle,
        artistId: trackArtistId,
        albumId,
        sourceId,
        userId,
      },
    });

    return [track, trackArtist, album, albumArtist];
  });
}

export function dbTrackCount(userId: string): Promise<number> {
  return client.track.count({
    where: {
      userId,
    },
  });
}
