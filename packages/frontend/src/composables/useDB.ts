import {
  compareAlbum,
  compareArtist,
  comparePlaylist,
  compareTrack,
} from '$shared/sort';
import type {
  ResourceAlbum,
  ResourceArtist,
  ResourceImage,
  ResourcePlaylist,
  ResourceSource,
  ResourceSourceFile,
  ResourceTrack,
} from '$/types';
import { db } from '~/db';
import { transformObservableComputed, useLiveQuery } from './useLiveQuery';

function _useAllAlbums() {
  console.log('useDB: _useAllAlbums called');
  return useLiveQuery(async (): Promise<readonly ResourceAlbum[]> => {
    console.log('useDB: _useAllAlbums: liveQuery callback called');
    return (await db.albums.toArray()).sort(compareAlbum);
  });
}

function _useAllArtists() {
  console.log('useDB: _useAllArtists called');
  return useLiveQuery(async (): Promise<readonly ResourceArtist[]> => {
    console.log('useDB: _useAllArtists: liveQuery callback called');
    return (await db.artists.toArray()).sort(compareArtist);
  });
}

function _useAllImages() {
  console.log('useDB: _useAllImages called');
  return useLiveQuery(async (): Promise<readonly ResourceImage[]> => {
    console.log('useDB: _useAllImages: liveQuery callback called');
    return await db.images.toArray();
  });
}

function _useAllPlaylists() {
  console.log('useDB: _useAllPlaylists called');
  return useLiveQuery(async (): Promise<readonly ResourcePlaylist[]> => {
    console.log('useDB: _useAllPlaylists: liveQuery callback called');
    return (await db.playlists.toArray()).sort(comparePlaylist);
  });
}

function _useAllSourceFiles() {
  console.log('useDB: _useAllSourceFiles called');
  return useLiveQuery(async (): Promise<readonly ResourceSourceFile[]> => {
    console.log('useDB: _useAllSourceFiles: liveQuery callback called');
    return await db.sourceFiles.toArray();
  });
}

function _useAllSources() {
  console.log('useDB: _useAllSources called');
  return useLiveQuery(async (): Promise<readonly ResourceSource[]> => {
    console.log('useDB: _useAllSources: liveQuery callback called');
    return await db.sources.toArray();
  });
}

function _useAllTracks() {
  console.log('useDB: _useAllTracks called');
  return useLiveQuery(async (): Promise<readonly ResourceTrack[]> => {
    console.log('useDB: _useAllTracks: liveQuery callback called');
    return (await db.tracks.toArray()).sort(compareTrack);
  });
}

//

function _createMap<T extends { readonly id: string }>(
  items: readonly T[]
): ReadonlyMap<string, T> {
  return new Map<string, T>(items.map((item): [string, T] => [item.id, item]));
}

export const useAllAlbums = createSharedComposable(_useAllAlbums);
export const useAllArtists = createSharedComposable(_useAllArtists);
export const useAllImages = createSharedComposable(_useAllImages);
export const useAllPlaylists = createSharedComposable(_useAllPlaylists);
export const useAllSourceFiles = createSharedComposable(_useAllSourceFiles);
export const useAllSources = createSharedComposable(_useAllSources);
export const useAllTracks = createSharedComposable(_useAllTracks);

export const useAllAlbumMap = createSharedComposable(() =>
  transformObservableComputed(useAllAlbums(), _createMap)
);
export const useAllArtistMap = createSharedComposable(() =>
  transformObservableComputed(useAllArtists(), _createMap)
);
export const useAllImageMap = createSharedComposable(() =>
  transformObservableComputed(useAllImages(), _createMap)
);
export const useAllPlaylistMap = createSharedComposable(() =>
  transformObservableComputed(useAllPlaylists(), _createMap)
);
export const useAllSourceMap = createSharedComposable(() =>
  transformObservableComputed(useAllSources(), _createMap)
);
export const useAllSourceFileMap = createSharedComposable(() =>
  transformObservableComputed(useAllSourceFiles(), _createMap)
);
export const useAllTrackMap = createSharedComposable(() =>
  transformObservableComputed(useAllTracks(), _createMap)
);
