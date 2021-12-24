import {
  compareAlbum,
  compareArtist,
  comparePlaylist,
  compareTrack,
} from '$shared/sort';
import { db } from '~/db';
import type { ResourceImage } from '$/types';
import { useLiveQuery } from './useLiveQuery';

function _useAllAlbums() {
  console.log('useDB: _useAllAlbums called');
  return useLiveQuery(async () => {
    console.log('useDB: _useAllAlbums: liveQuery callback called');
    return (await db.albums.toArray()).sort(compareAlbum);
  });
}

function _useAllArtists() {
  console.log('useDB: _useAllArtists called');
  return useLiveQuery(async () => {
    console.log('useDB: _useAllArtists: liveQuery callback called');
    return (await db.artists.toArray()).sort(compareArtist);
  });
}

function _useAllPlaylists() {
  console.log('useDB: _useAllPlaylists called');
  return useLiveQuery(async () => {
    console.log('useDB: _useAllPlaylists: liveQuery callback called');
    return (await db.playlists.toArray()).sort(comparePlaylist);
  });
}

function _useAllTracks() {
  console.log('useDB: _useAllTracks called');
  return useLiveQuery(async () => {
    console.log('useDB: _useAllTracks: liveQuery callback called');
    return (await db.tracks.toArray()).sort(compareTrack);
  });
}

function _useAllImageMap() {
  console.log('useDB: _useAllImageMap called');
  return useLiveQuery(async (): Promise<ReadonlyMap<string, ResourceImage>> => {
    console.log('useDB: _useAllImageMap: liveQuery callback called');
    return new Map(
      (await db.images.toArray()).map((image) => [image.id, image])
    );
  });
}

export const useAllAlbums = createSharedComposable(_useAllAlbums);
export const useAllArtists = createSharedComposable(_useAllArtists);
export const useAllPlaylists = createSharedComposable(_useAllPlaylists);
export const useAllTracks = createSharedComposable(_useAllTracks);
export const useAllImageMap = createSharedComposable(_useAllImageMap);
