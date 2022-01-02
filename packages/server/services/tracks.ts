import { Prisma } from '@prisma/client';
import { dbArrayRemoveFromAllTx } from '$/db/lib/array';
import { client } from '$/db/lib/client';
import { dbDeletionAddTx, dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { HTTPError } from '$/utils/httpError';
import { albumDeleteIfUnreferenced } from './albums';
import { artistDeleteIfUnreferenced } from './artists';

/**
 * 指定されたトラックを削除する \
 * 参照されなくなった場合アルバムやアーティストも削除する（オプション） \
 * プレイリストは空になっても削除しない
 *
 * @description
 * - 同時に削除するもの: TrackCoArtist (via CASCADE)
 * ! 本メソッドは更新日時を更新する（削除時のみ） \
 * ! 本メソッドは削除記録を追加する（削除時のみ）
 */
export async function trackDelete(
  userId: string,
  trackId: string,
  deleteAlbumAndArtists = false
): Promise<void> {
  const track = await client.$transaction(async (txClient) => {
    const track = await txClient.track.findFirst({
      where: {
        id: trackId,
        userId,
      },
      select: {
        albumId: true,
        artistId: true,
      },
    });
    if (!track) {
      throw new HTTPError(404, `Track ${trackId} not found`);
    }

    // remove track from playlists
    await dbArrayRemoveFromAllTx<typeof Prisma.PlaylistScalarFieldEnum>(
      txClient,
      userId,
      Prisma.ModelName.Playlist,
      Prisma.ModelName.Track,
      'trackOrder',
      trackId
    );

    // delete track
    // * Track is referenced from: TrackCoArtist, Playlist (implicit m:n)
    // TrackCoArtist will be cascade deleted (Deletion of TrackCoArtist is not recorded, therefore the client must synchronize TrackCoArtist based on the Deletion of Track)
    // TODO(db): set ON DELETE RESTRICT for Playlist (implicit m:n) table
    await txClient.track.deleteMany({
      where: {
        id: trackId,
        userId,
      },
    });

    await dbDeletionAddTx(txClient, userId, 'track', trackId);

    return track;
  });

  if (deleteAlbumAndArtists) {
    const albumArtistId = await albumDeleteIfUnreferenced(
      userId,
      track.albumId,
      true
    );

    await artistDeleteIfUnreferenced(userId, track.artistId, true);

    if (albumArtistId && albumArtistId !== track.artistId) {
      await artistDeleteIfUnreferenced(userId, albumArtistId, true);
    }
  }

  await dbResourceUpdateTimestamp(userId);
}
