import { Prisma } from '@prisma/client';
import { dbArrayRemoveFromAllTx } from '$/db/lib/array';
import { client } from '$/db/lib/client';
import { dbDeletionAddTx, dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { osDeleteTrackFiles } from '$/os/trackFile';
import { HTTPError } from '$/utils/httpError';
import { albumDeleteIfUnreferenced } from './albums';
import { artistDeleteIfUnreferenced } from './artists';
import { sourceFileDeleteFromOSIfUnreferenced } from './sourceFiles';

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
  const [track, trackFiles] = await client.$transaction(async (txClient) => {
    const track = await txClient.track.findFirst({
      where: {
        id: trackId,
        userId,
      },
      select: {
        albumId: true,
        artistId: true,
        sourceFileId: true,
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

    // delete track files
    const trackFiles = await txClient.trackFile.findMany({
      where: {
        trackId,
        userId,
      },
      select: {
        id: true,
        extension: true,
        region: true,
      },
    });

    const deletedFiles = await txClient.trackFile.deleteMany({
      where: {
        id: {
          in: trackFiles.map((trackFile) => trackFile.id),
        },
        trackId,
        userId,
      },
    });
    if (deletedFiles.count !== trackFiles.length) {
      throw new HTTPError(
        409,
        `TrackFile of Track ${trackId} was modified during deletion`
      );
    }

    // delete track
    // * Track is referenced from: TrackCoArtist, Playlist (implicit m:n)
    // TrackCoArtist will be cascade deleted (Deletion of TrackCoArtist is not recorded, therefore the client must synchronize TrackCoArtist based on the Deletion of Track)
    // TODO(db): set ON DELETE RESTRICT for Playlist (implicit m:n) table
    const deleted = await txClient.track.deleteMany({
      where: {
        id: trackId,
        albumId: track.albumId,
        artistId: track.artistId,
        sourceFileId: track.sourceFileId,
        userId,
      },
    });
    if (deleted.count === 0) {
      throw new HTTPError(409, `Track ${trackId} was modified during deletion`);
    }

    await dbDeletionAddTx(txClient, userId, 'track', trackId);

    return [track, trackFiles];
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

  await sourceFileDeleteFromOSIfUnreferenced(userId, track.sourceFileId, true);

  await dbResourceUpdateTimestamp(userId);

  await osDeleteTrackFiles(userId, trackFiles);
}
