import Fuse from 'fuse.js';
import type { Ref } from 'vue';
import { useAllAlbums, useAllArtists } from './useDB';

function createFuse<T>(
  items: Readonly<Ref<readonly T[] | undefined>>,
  options: Fuse.IFuseOptions<T>
): Readonly<Ref<Fuse<T>>> {
  return computed(() => {
    return new Fuse(items.value || [], options);
  });
}

function _useAlbumSearch() {
  const albums = useAllAlbums();
  const fuse = createFuse(albums.value, { keys: ['title'] });
  return (term: Readonly<Ref<string>>) =>
    computed(() => fuse.value.search(term.value));
}

function _useArtistSearch() {
  const artists = useAllArtists();
  const fuse = createFuse(artists.value, { keys: ['name'] });
  return (term: Readonly<Ref<string>>) =>
    computed(() => fuse.value.search(term.value));
}

export const useAlbumSearch = createSharedComposable(_useAlbumSearch);
export const useArtistSearch = createSharedComposable(_useArtistSearch);
