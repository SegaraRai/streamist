import type {
  ResourceAlbum,
  ResourceArtist,
  ResourcePlaylist,
  ResourceTrack,
} from '$/types';
import {
  useAllAlbums,
  useAllArtists,
  useAllPlaylists,
  useAllTracks,
} from './useDB';

export type AllItem =
  | {
      t: 'album';
      l: string;
      i: ResourceAlbum;
    }
  | {
      t: 'artist';
      l: string;
      i: ResourceArtist;
    }
  | {
      t: 'playlist';
      l: string;
      i: ResourcePlaylist;
    }
  | {
      t: 'track';
      l: string;
      i: ResourceTrack;
    };

function _useAllItems() {
  const { value: albums } = useAllAlbums();
  const { value: artists } = useAllArtists();
  const { value: playlists } = useAllPlaylists();
  const { value: tracks } = useAllTracks();
  return computed<AllItem[] | undefined>(() => {
    if (!albums.value || !artists.value || !playlists.value || !tracks.value) {
      return;
    }
    return [
      ...albums.value.map(
        (album): AllItem => ({
          t: 'album',
          l: album.title,
          i: album,
        })
      ),
      ...artists.value.map(
        (item): AllItem => ({
          t: 'artist',
          l: item.name,
          i: item,
        })
      ),
      ...playlists.value.map(
        (item): AllItem => ({
          t: 'playlist',
          l: item.title,
          i: item,
        })
      ),
      ...tracks.value.map(
        (item): AllItem => ({
          t: 'track',
          l: item.title,
          i: item,
        })
      ),
    ];
  });
}

export const useAllItems = createSharedComposable(_useAllItems);
