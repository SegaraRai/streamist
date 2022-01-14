import { MenuOption, useMessage } from 'naive-ui';
import type { ComputedRef, Ref } from 'vue';
import type { ResourceAlbum, ResourceTrack } from '$/types';
import { useTrackFilter } from '~/logic/filterTracks';
import { usePlaybackStore } from '~/stores/playback';
import { nCreateDropdownIcon, nCreateDropdownTextColorStyle } from './dropdown';

export interface AlbumDropdownCreateOptions {
  readonly album$$q: Readonly<Ref<ResourceAlbum | null | undefined>>;
  readonly albumTracks$$q: Readonly<
    Ref<readonly ResourceTrack[] | null | undefined>
  >;
  readonly openEditAlbumDialog$$q: () => void;
  readonly openMergeAlbumDialog$$q: () => void;
  readonly closeMenu$$q: () => void;
}

export function createAlbumDropdown({
  album$$q,
  albumTracks$$q,
  openEditAlbumDialog$$q,
  openMergeAlbumDialog$$q,
  closeMenu$$q,
}: AlbumDropdownCreateOptions): ComputedRef<MenuOption[]> {
  const { t } = useI18n();
  const message = useMessage();
  const playbackStore = usePlaybackStore();
  const { isTrackAvailable$$q } = useTrackFilter();

  return computed((): MenuOption[] => {
    if (!album$$q.value) {
      return [];
    }

    const album = album$$q.value;
    const albumTracks = albumTracks$$q.value;
    const availableAlbumTracks = albumTracks$$q.value?.filter((track) =>
      isTrackAvailable$$q(track.id)
    );

    const menuItems: MenuOption[] = [];

    // Play
    menuItems.push({
      key: 'play',
      label: t('dropdown.playlist.Play'),
      icon: nCreateDropdownIcon('mdi-play'),
      disabled: !availableAlbumTracks?.length,
      props: {
        onClick: (): void => {
          closeMenu$$q();
          if (!albumTracks?.length || !availableAlbumTracks?.length) {
            return;
          }
          playbackStore.setSetListAndPlayAuto$$q(
            album.title,
            albumTracks,
            false
          );
        },
      },
    });

    // Add To Play Next Queue
    menuItems.push({
      key: 'addToPNQueue',
      label: t('dropdown.album.AddToPlayNextQueue'),
      icon: nCreateDropdownIcon('mdi-playlist-play'),
      disabled: !availableAlbumTracks?.length,
      props: {
        onClick: (): void => {
          closeMenu$$q();
          if (!albumTracks?.length || !availableAlbumTracks?.length) {
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

    // Merge
    menuItems.push({
      key: 'merge',
      label: t('dropdown.album.Merge'),
      icon: nCreateDropdownIcon('mdi-merge'),
      props: {
        style: nCreateDropdownTextColorStyle('warning'),
        onClick: (): void => {
          openMergeAlbumDialog$$q();
          closeMenu$$q();
        },
      },
    });

    return menuItems;
  });
}
