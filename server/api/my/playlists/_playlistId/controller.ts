import { defineController } from './$relay';
import { client } from '$/db/lib/client';
import { dbPlaylistCreate, dbPlaylistRemove } from '$/db/playlist';
import { HTTPError } from '$/utils/httpError';
import { generatePlaylistId } from '$/utils/id';

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
            track: {
              include: {
                artist: !!query?.includeTrackArtist,
                album: !!query?.includeTrackAlbum && {
                  include: {
                    artist: !!query?.includeTrackAlbumArtist,
                    images: !!query?.includeTrackAlbumImages && {
                      include: {
                        image: true,
                      },
                    },
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
        name: body.name,
      },
    });
    if (!newPlaylist) {
      throw new HTTPError(404, `Playlist ${params.playlistId} not found`);
    }
    return { status: 204 };
  },
  delete: async ({ params, user }) => {
    await dbPlaylistRemove(user.id, params.playlistId);
    return { status: 204 };
  },
}));
