import { db } from '~/db';
import { createMultiMap } from '~/logic/multiMap';
import { compareAlbum, compareArtist, compareTrack } from '~/logic/sort';
import { ImageWithFile } from '~/types/image';
import {
  AlbumForPlayback,
  AlbumForPlaybackWithTracks,
  ArtistForPlayback,
} from '~/types/playback';
import type { Artist } from '$prisma/client';
import { ResourceAlbum, ResourceTrack } from '$/types';

export async function fetchArtist(artistId: string): Promise<Artist> {
  const artist = await db.artists.get(artistId);
  if (!artist) {
    throw new Error(`Artist ${artistId} not found`);
  }
  return artist;
}

export async function fetchArtistsForPlayback(): Promise<ArtistForPlayback[]> {
  const { albums, artists, images, tracks } = await db.transaction(
    'r',
    [db.albums, db.artists, db.images, db.tracks],
    async () => {
      return {
        albums: await db.albums.toArray(),
        artists: await db.artists.toArray(),
        images: await db.images.toArray(),
        tracks: await db.tracks.toArray(),
      };
    }
  );

  const albumIds = albums.map((album) => album.id);
  const artistIds = artists.map((artist) => artist.id);

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
  const albumMultiMap: ReadonlyMap<string, ResourceAlbum[]> = createMultiMap(
    albums,
    'artistId',
    artistIds
  );
  const trackMultiMap: ReadonlyMap<string, ResourceTrack[]> = createMultiMap(
    tracks,
    'artistId',
    artistIds
  );
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

  return artists
    .map((artist) => {
      const albums = albumMultiMap
        .get(artist.id)!
        .map((album) => createAlbumForPlaybackWithTracks(album, artist))
        .sort(compareAlbum);

      const tracks = trackMultiMap
        .get(artist.id)!
        .map((track) => {
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
        ...artist,
        albums,
        tracks,
      };
    })
    .sort(compareArtist);
}

export async function fetchArtistForPlayback(
  artistId: string
): Promise<ArtistForPlayback> {
  const artist = (await fetchArtistsForPlayback()).find(
    (item) => item.id === artistId
  );
  if (!artist) {
    throw new Error(`Artist ${artistId} not found`);
  }
  return artist;
}
