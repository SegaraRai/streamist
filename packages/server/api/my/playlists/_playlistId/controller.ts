import { ImageSortableAlbum, dbAlbumSortImages } from '$/db/album';
import { client } from '$/db/lib/client';
import { dbPlaylistSortTracks } from '$/db/playlist';
import { playlistDelete, playlistUpdate } from '$/services/playlists';
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
    await playlistUpdate(user.id, params.playlistId, body);
    return { status: 204 };
  },
  delete: async ({ params, user }) => {
    await playlistDelete(user.id, params.playlistId);
    return { status: 204 };
  },
}));
