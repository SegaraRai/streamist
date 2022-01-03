import { ImageSortableAlbum, dbAlbumSortImages } from '$/db/album';
import { client } from '$/db/lib/client';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { dbPlaylistSortTracks } from '$/db/playlist';
import { playlistDelete } from '$/services/playlists';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, query, user }) => {
    const playlist = await client.playlist.findFirst({
      where: {
        id: params.playlistId,
        userId: user.id,
      },
      include: {
        tracks: !!query?.includeTracks && {
          include: {
            artist: !!query.includeTrackArtist,
            album: !!query.includeTrackAlbum && {
              include: {
                artist: !!query.includeTrackAlbumArtist,
                images: !!query.includeTrackAlbumImages && {
                  include: {
                    files: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!playlist) {
      throw new HTTPError(404, `Playlist ${params.playlistId} not found`);
    }
    if (query?.includeTracks) {
      dbPlaylistSortTracks(playlist);
    }
    if (
      query?.includeTracks &&
      query.includeTrackAlbum &&
      query.includeTrackAlbumImages
    ) {
      for (const track of playlist.tracks) {
        const { album } = track as unknown as { album: ImageSortableAlbum };
        dbAlbumSortImages(album);
      }
    }
    return {
      status: 200,
      body: playlist,
    };
  },
  patch: async ({ body, params, user }) => {
    if (body.title == null && body.notes == null) {
      return { status: 204 };
    }

    if (body.title != null && !body.title.trim()) {
      throw new HTTPError(400, 'title must not be empty');
    }

    const newPlaylist = await client.playlist.updateMany({
      where: {
        id: params.playlistId,
        userId: user.id,
      },
      data: {
        title: body.title?.trim(),
        notes: body.notes?.trim(),
        updatedAt: Date.now(),
      },
    });
    if (!newPlaylist) {
      throw new HTTPError(404, `Playlist ${params.playlistId} not found`);
    }
    await dbResourceUpdateTimestamp(user.id);
    return { status: 204 };
  },
  delete: async ({ params, user }) => {
    await playlistDelete(user.id, params.playlistId);
    return { status: 204 };
  },
}));
