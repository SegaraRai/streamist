import { db } from '~/db';
import { createMultiMap } from '~/logic/multiMap';
import { comparePlaylist, compareTrack } from '~/logic/sort';
import type { ImageWithFile } from '~/types/image';
import type {
  AlbumForPlayback,
  AlbumForPlaybackWithTracks,
  PlaylistForPlayback,
} from '~/types/playback';
import type { PlaylistWithTrackFile } from '~/types/playlist';
import type { Artist } from '$prisma/client';
import type { ResourceAlbum, ResourceTrack } from '$/types';
import { fetchPlaylistTracks } from './utils';

export async function fetchPlaylistWithTrack(
  playlistId: string
): Promise<PlaylistWithTrackFile> {
  const { playlist, tracks } = await db.transaction(
    'r',
    [db.albums, db.artists, db.tracks],
    async () => {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) {
        throw new Error(`Playlist ${playlistId} not found`);
      }
      const tracks = await fetchPlaylistTracks(playlist);
      return {
        playlist,
        tracks,
      };
    }
  );
  return {
    ...playlist,
    tracks,
  };
}

export async function fetchPlaylistsForPlayback(): Promise<
  PlaylistForPlayback[]
> {
  const { albums, artists, images, playlists, tracks } = await db.transaction(
    'r',
    [db.albums, db.artists, db.images, db.playlists, db.tracks],
    async () => {
      return {
        albums: await db.albums.toArray(),
        artists: await db.artists.toArray(),
        images: await db.images.toArray(),
        playlists: await db.playlists.toArray(),
        tracks: await db.tracks.toArray(),
      };
    }
  );

  const albumIds = albums.map((album) => album.id);

  const albumMap: ReadonlyMap<string, ResourceAlbum> = new Map<
    string,
    ResourceAlbum
  >(albums.map((item) => [item.id, item]));
  const artistMap: ReadonlyMap<string, Artist> = new Map<string, Artist>(
    artists.map((item) => [item.id, item])
  );
  const imageMap: ReadonlyMap<string, ImageWithFile> = new Map<
    string,
    ImageWithFile
  >(images.map((item) => [item.id, item]));
  const trackMap: ReadonlyMap<string, ResourceTrack> = new Map<
    string,
    ResourceTrack
  >(tracks.map((item) => [item.id, item]));
  const trackMultiMapForAlbum: ReadonlyMap<string, ResourceTrack[]> =
    createMultiMap(tracks, 'albumId', albumIds);

  const createAlbumForPlaybackWithTracks = (
    album: ResourceAlbum,
    artist: Artist
  ): AlbumForPlaybackWithTracks => {
    const images = album.imageIds.map((imageId) => {
      const image = imageMap.get(imageId);
      if (!image) {
        throw new Error(`Image ${imageId} not found (database corrupt)`);
      }
      return image;
    });
    const albumForPlayback: AlbumForPlayback = {
      ...album,
      artist,
      images,
    };
    const tracks = trackMultiMapForAlbum
      .get(album.id)!
      .map((track) => {
        const trackArtist = artistMap.get(album.artistId);
        if (!trackArtist) {
          throw new Error(
            `Track artist ${track.artistId} not found. (database corrupted)`
          );
        }
        return {
          ...track,
          album: albumForPlayback,
          artist: trackArtist,
        };
      })
      .sort(compareTrack);
    return {
      ...albumForPlayback,
      tracks,
    };
  };

  return playlists
    .map((playlist): PlaylistForPlayback => {
      const tracks = playlist.trackIds
        .map((trackId) => {
          const track = trackMap.get(trackId);
          if (!track) {
            throw new Error(`Track ${trackId} not found (database corrupt)`);
          }
          const artist = artistMap.get(track.artistId);
          if (!artist) {
            throw new Error(
              `Track artist ${track.artistId} not found (database corrupt)`
            );
          }
          const album = albumMap.get(track.albumId);
          if (!album) {
            throw new Error(
              `Album ${track.albumId} not found (database corrupt)`
            );
          }
          const albumArtist = artistMap.get(album.artistId);
          if (!albumArtist) {
            throw new Error(
              `Album artist ${album.artistId} not found. (database corrupted)`
            );
          }
          const albumForPlaybackWithTracks = createAlbumForPlaybackWithTracks(
            album,
            albumArtist
          );
          return {
            ...track,
            album: albumForPlaybackWithTracks,
            artist,
          };
        })
        .sort(compareTrack);

      return {
        ...playlist,
        tracks,
      };
    })
    .sort(comparePlaylist);
}

export async function fetchPlaylistForPlayback(
  artistId: string
): Promise<PlaylistForPlayback> {
  const playlist = (await fetchPlaylistsForPlayback()).find(
    (item) => item.id === artistId
  );
  if (!playlist) {
    throw new Error(`Playlist ${artistId} not found`);
  }
  return playlist;
}
