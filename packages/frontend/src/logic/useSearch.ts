import Fuse from 'fuse.js';
import type { Ref } from 'vue';
import { useAllItems } from './allItem';
import {
  useAllAlbums,
  useAllArtists,
  useAllPlaylists,
  useAllTracks,
} from './useDB';

function createFuse<T>(
  items: Readonly<Ref<readonly T[] | undefined>>,
  options: Fuse.IFuseOptions<T>
): Readonly<Ref<Fuse<T>>> {
  return computed(() => {
    return new Fuse(items.value || [], options);
  });
}

function _useAlbumSearch() {
  const items = useAllAlbums();
  const fuse = createFuse(items.value, { keys: ['title'] });
  return (term: Readonly<Ref<string>>) =>
    computed(() => fuse.value.search(term.value));
}

function _useArtistSearch() {
  const items = useAllArtists();
  const fuse = createFuse(items.value, { keys: ['name'] });
  return (term: Readonly<Ref<string>>) =>
    computed(() => fuse.value.search(term.value));
}

function _useTrackSearch() {
  const items = useAllTracks();
  const fuse = createFuse(items.value, { keys: ['title'] });
  return (term: Readonly<Ref<string>>) =>
    computed(() => fuse.value.search(term.value));
}

function _usePlaylistSearch() {
  const items = useAllPlaylists();
  const fuse = createFuse(items.value, { keys: ['title'] });
  return (term: Readonly<Ref<string>>) =>
    computed(() => fuse.value.search(term.value));
}

function _useAllSearch() {
  const items = useAllItems();
  const fuse = createFuse(items, { keys: ['l'] });
  return (term: Readonly<Ref<string>>) =>
    computed(() => fuse.value.search(term.value));
}

export const useAlbumSearch = createSharedComposable(_useAlbumSearch);
export const useArtistSearch = createSharedComposable(_useArtistSearch);
export const useTrackSearch = createSharedComposable(_useTrackSearch);
export const usePlaylistSearch = createSharedComposable(_usePlaylistSearch);
export const useAllSearch = createSharedComposable(_useAllSearch);
