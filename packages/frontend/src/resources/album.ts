import { db } from '~/db';
import { createMultiMap } from '~/logic/multiMap';
import { compareAlbum, compareTrack } from '~/logic/sort';
import type { AlbumWithImage } from '~/types/album';
import type {
  AlbumForPlayback,
  AlbumForPlaybackWithTracks,
  TrackForPlayback,
} from '~/types/playback';
import type { Artist } from '$prisma/client';
import type { ResourceImage, ResourceTrack } from '$/types';
import { fetchAlbumImages } from './utils';

export async function fetchAlbumWithImages(
  albumId: string
): Promise<AlbumWithImage> {
  const { album, images } = await db.transaction(
    'r',
    [db.albums, db.images],
    async () => {
      const album = await db.albums.get(albumId);
      if (!album) {
        throw new Error(`Album ${albumId} not found`);
      }
      const images = await fetchAlbumImages(album);
      return {
        album,
        images,
      };
    }
  );
  return {
    ...album,
    images,
  };
}

export async function fetchAlbumForPlayback(
  albumId: string
): Promise<AlbumForPlayback> {
  const { album, artist, images } = await db.transaction(
    'r',
    [db.albums, db.artists, db.images],
    async () => {
      const album = await db.albums.get(albumId);
      if (!album) {
        throw new Error(`Album ${albumId} not found`);
      }
      const images = await fetchAlbumImages(album);
      const artist = await db.artists.get(album.artistId);
      if (!artist) {
        throw new Error(
          `Artist ${album.artistId} not found. (database corrupted)`
        );
      }
      return {
        album,
        artist,
        images,
      };
    }
  );
  return {
    ...album,
    artist,
    images,
  };
}

export async function fetchAlbumForPlaybackWithTracks(
  albumId: string
): Promise<AlbumForPlaybackWithTracks> {
  const { album, artist, images, trackArtists, tracks } = await db.transaction(
    'r',
    [db.albums, db.artists, db.images, db.tracks],
    async () => {
      const album = await db.albums.get(albumId);
      if (!album) {
        throw new Error(`Album ${albumId} not found`);
      }
      const images = await fetchAlbumImages(album);
      const tracks = await db.tracks.where({ albumId }).toArray();
      const [artist, ...trackArtists] = await db.artists.bulkGet([
        album.artistId,
        ...tracks.map((track) => track.artistId),
      ]);

      return {
        album,
        artist,
        images,
        trackArtists,
        tracks,
      };
    }
  );

  if (!artist) {
    throw new Error(`Artist ${album.artistId} not found. (database corrupted)`);
  }
  const albumForPlayback: AlbumForPlayback = {
    ...album,
    artist,
    images,
  };
  const tracksForPlayback = tracks.map((track, index): TrackForPlayback => {
    const artist = trackArtists[index];
    if (!artist) {
      throw new Error(
        `Artist ${track.artistId} not found. (database corrupted)`
      );
    }
    return {
      ...track,
      album: albumForPlayback,
      artist,
    };
  });
  tracksForPlayback.sort(compareTrack);

  return {
    ...albumForPlayback,
    tracks: tracksForPlayback,
  };
}

export async function fetchAlbumsForPlaybackWithTracks(): Promise<
  AlbumForPlaybackWithTracks[]
> {
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

  const artistsMap: ReadonlyMap<string, Artist> = new Map<string, Artist>(
    artists.map((item) => [item.id, item])
  );
  const imageMap: ReadonlyMap<string, ResourceImage> = new Map<
    string,
    ResourceImage
  >(images.map((item) => [item.id, item]));
  const trackMultiMap: ReadonlyMap<string, ResourceTrack[]> = createMultiMap(
    tracks,
    'albumId',
    albums.map((item) => item.id)
  );

  return albums
    .map((album) => {
      const artist = artistsMap.get(album.artistId);
      if (!artist) {
        throw new Error(
          `Album artist ${album.artistId} not found. (database corrupted)`
        );
      }
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
      const tracks = trackMultiMap
        .get(album.id)!
        .map((track) => {
          const trackArtist = artistsMap.get(track.artistId);
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
    })
    .sort(compareAlbum);
}
