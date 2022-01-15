import { MenuOption, useMessage } from 'naive-ui';
import type { ComputedRef, Ref } from 'vue';
import type { ResourceAlbum, ResourceTrack } from '$/types';
import {
  nCreateDropdownIcon,
  nCreateDropdownTextColorStyle,
} from '~/logic/naiveUI/dropdown';
import { usePlaybackStore } from '~/stores/playback';
import { useTrackFilter } from '../useTrackFilter';

export interface NDropdownAlbumCreateOptions {
  readonly album$$q: Readonly<Ref<ResourceAlbum | null | undefined>>;
  readonly albumTracks$$q: Readonly<
    Ref<readonly ResourceTrack[] | null | undefined>
  >;
  readonly openEditAlbumDialog$$q?: () => void;
  readonly openMergeAlbumDialog$$q?: () => void;
  readonly closeMenu$$q: () => void;
}

export function useNDropdownAlbum({
  album$$q,
  albumTracks$$q,
  openEditAlbumDialog$$q,
  openMergeAlbumDialog$$q,
  closeMenu$$q,
}: NDropdownAlbumCreateOptions): ComputedRef<MenuOption[]> {
  const { t } = useI18n();
  const message = useMessage();
  const playbackStore = usePlaybackStore();
  const { isTrackAvailable$$q } = useTrackFilter();

  const delayedCloseMenu = (): void => {
    setTimeout((): void => closeMenu$$q(), 0);
  };

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
          delayedCloseMenu();
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
          delayedCloseMenu();
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

    if (openEditAlbumDialog$$q || openMergeAlbumDialog$$q) {
      // --- divider ---
      menuItems.push({
        key: 'div1',
        type: 'divider',
      });

      // Edit
      if (openEditAlbumDialog$$q) {
        menuItems.push({
          key: 'edit',
          label: t('dropdown.album.Edit'),
          icon: nCreateDropdownIcon('mdi-pencil'),
          props: {
            onClick: (): void => {
              delayedCloseMenu();
              openEditAlbumDialog$$q();
            },
          },
        });
      }

      // Merge
      if (openMergeAlbumDialog$$q) {
        menuItems.push({
          key: 'merge',
          label: t('dropdown.album.Merge'),
          icon: nCreateDropdownIcon('mdi-merge'),
          props: {
            style: nCreateDropdownTextColorStyle('warning'),
            onClick: (): void => {
              delayedCloseMenu();
              openMergeAlbumDialog$$q();
            },
          },
        });
      }
    }

    return menuItems;
  });
}
