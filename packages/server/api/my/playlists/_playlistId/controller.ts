import { ImageSortableAlbum, dbAlbumSortImages } from '$/db/album';
import { client } from '$/db/lib/client';
import { dbPlaylistSortTracks } from '$/db/playlist';
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
    const newPlaylist = await client.playlist.updateMany({
      where: {
        id: params.playlistId,
        userId: user.id,
      },
      data: {
        title: body.title,
      },
    });
    if (!newPlaylist) {
      throw new HTTPError(404, `Playlist ${params.playlistId} not found`);
    }
    return { status: 204 };
  },
  delete: async ({ params, user }) => {
    const deleted = await client.playlist.deleteMany({
      where: {
        id: params.playlistId,
        userId: user.id,
      },
    });
    if (deleted.count === 0) {
      throw new HTTPError(404, `Playlist ${params.playlistId} not found`);
    }
    return { status: 204 };
  },
}));
