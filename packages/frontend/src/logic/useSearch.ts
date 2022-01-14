import type { Ref } from 'vue';
import { useAllItems } from './allItem';
import { createFuse } from './fuse';
import {
  useAllAlbums,
  useAllArtists,
  useAllPlaylists,
  useAllTracks,
} from './useDB';

const createOptions = (limit?: number) =>
  limit
    ? {
        limit,
      }
    : undefined;

function _useAlbumSearch(limit?: number) {
  const items = useAllAlbums();
  const options = createOptions(limit);
  const fuse = createFuse(items.value, { keys: ['title'] });
  return (term: Readonly<Ref<string>>) =>
    computed(() => fuse.value.search(term.value, options));
}

function _useArtistSearch(limit?: number) {
  const items = useAllArtists();
  const options = createOptions(limit);
  const fuse = createFuse(items.value, { keys: ['name'] });
  return (term: Readonly<Ref<string>>) =>
    computed(() => fuse.value.search(term.value, options));
}

function _useTrackSearch(limit?: number) {
  const items = useAllTracks();
  const options = createOptions(limit);
  const fuse = createFuse(items.value, { keys: ['title'] });
  return (term: Readonly<Ref<string>>) =>
    computed(() => fuse.value.search(term.value, options));
}

function _usePlaylistSearch(limit?: number) {
  const items = useAllPlaylists();
  const options = createOptions(limit);
  const fuse = createFuse(items.value, { keys: ['title'] });
  return (term: Readonly<Ref<string>>) =>
    computed(() => fuse.value.search(term.value, options));
}

function _useAllSearch(limit?: number) {
  const items = useAllItems();
  const options = createOptions(limit);
  const fuse = createFuse(items, { keys: ['l'] });
  return (term: Readonly<Ref<string>>) =>
    computed(() => fuse.value.search(term.value, options));
}

export const useAlbumSearch = createSharedComposable(_useAlbumSearch);
export const useArtistSearch = createSharedComposable(_useArtistSearch);
export const useTrackSearch = createSharedComposable(_useTrackSearch);
export const usePlaylistSearch = createSharedComposable(_usePlaylistSearch);
export const useAllSearch = createSharedComposable(_useAllSearch);
