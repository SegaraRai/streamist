import { MenuOption, useMessage } from 'naive-ui';
import type { ComputedRef, Ref } from 'vue';
import type { ResourceAlbum, ResourceTrack } from '$/types';
import { usePlaybackStore } from '~/stores/playback';
import { nCreateDropdownIcon } from './dropdown';

export interface AlbumDropdownCreateOptions {
  readonly album$$q: Readonly<Ref<ResourceAlbum | null | undefined>>;
  readonly albumTracks$$q: Readonly<
    Ref<readonly ResourceTrack[] | null | undefined>
  >;
  readonly openEditAlbumDialog$$q: () => void;
  readonly closeMenu$$q: () => void;
}

export function createAlbumDropdown({
  album$$q,
  albumTracks$$q,
  openEditAlbumDialog$$q,
  closeMenu$$q,
}: AlbumDropdownCreateOptions): ComputedRef<MenuOption[]> {
  const { t } = useI18n();
  const message = useMessage();
  const playbackStore = usePlaybackStore();

  return computed((): MenuOption[] => {
    if (!album$$q.value) {
      return [];
    }

    const albumTracks = albumTracks$$q.value;

    const menuItems: MenuOption[] = [];

    // Add To Play Next Queue
    menuItems.push({
      key: 'addToPNQueue',
      label: t('dropdown.album.AddToPlayNextQueue'),
      icon: nCreateDropdownIcon('mdi-playlist-play'),
      disabled: !albumTracks?.length,
      props: {
        onClick: (): void => {
          closeMenu$$q();
          if (!albumTracks?.length) {
            return;
          }
          playbackStore.appendTracksToPlayNextQueue$$q(albumTracks);
          message.success(
            t('message.n_AddedToPlayNextQueue', albumTracks.length)
          );
        },
      },
    });

    // --- divider ---
    menuItems.push({
      key: 'div1',
      type: 'divider',
    });

    // Edit
    menuItems.push({
      key: 'edit',
      label: t('dropdown.album.Edit'),
      icon: nCreateDropdownIcon('mdi-pencil'),
      props: {
        onClick: (): void => {
          openEditAlbumDialog$$q();
          closeMenu$$q();
        },
      },
    });

    return menuItems;
  });
}
