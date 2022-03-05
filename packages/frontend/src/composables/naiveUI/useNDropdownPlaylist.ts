import { MenuOption, useDialog, useMessage } from 'naive-ui';
import type { ComputedRef, Ref } from 'vue';
import type { ResourcePlaylist, ResourceTrack } from '$/types';
import { useSyncDB } from '~/db';
import { api } from '~/logic/api';
import { nCreateDialogContentWithWarning } from '~/logic/naiveUI/dialog';
import {
  nCreateDropdownIcon,
  nCreateDropdownTextColorStyle,
} from '~/logic/naiveUI/dropdown';
import { usePlaybackStore } from '~/stores/playback';
import { setRedirect } from '~/stores/redirect';
import { useTrackFilter } from '../useTrackFilter';

export interface NDropdownPlaylistCreateOptions {
  readonly playlist$$q: Readonly<Ref<ResourcePlaylist | null | undefined>>;
  readonly playlistTracks$$q: Readonly<
    Ref<readonly ResourceTrack[] | null | undefined>
  >;
  readonly showCreatePlaylist$$q: Readonly<Ref<boolean>>;
  readonly openEditPlaylistDialog$$q?: () => void;
  readonly openCreatePlaylistDialog$$q?: () => void;
  readonly closeMenu$$q: () => void;
}

export function useNDropdownPlaylist({
  playlist$$q,
  playlistTracks$$q,
  showCreatePlaylist$$q,
  openEditPlaylistDialog$$q,
  openCreatePlaylistDialog$$q,
  closeMenu$$q,
}: NDropdownPlaylistCreateOptions): ComputedRef<MenuOption[]> {
  const { t } = useI18n();
  const dialog = useDialog();
  const message = useMessage();
  const syncDB = useSyncDB();
  const playbackStore = usePlaybackStore();
  const { isTrackAvailable$$q } = useTrackFilter();

  const delayedCloseMenu = (): void => {
    setTimeout((): void => closeMenu$$q(), 0);
  };

  return computed((): MenuOption[] => {
    if (!playlist$$q.value) {
      return [];
    }

    const playlist = playlist$$q.value;
    const playlistId = playlist$$q.value.id;
    const playlistTracks = playlistTracks$$q.value;
    const availablePlaylistTracks = playlistTracks?.filter((track) =>
      isTrackAvailable$$q(track.id)
    );

    const menuItems: MenuOption[] = [];

    // Play
    menuItems.push({
      key: 'play',
      label: t('dropdown.playlist.Play'),
      icon: nCreateDropdownIcon('mdi-play'),
      disabled: !availablePlaylistTracks?.length,
      props: {
        onClick: (): void => {
          delayedCloseMenu();
          if (!availablePlaylistTracks?.length || !playlistTracks?.length) {
            return;
          }
          playbackStore.setSetListAndPlayAuto$$q(
            playlist.title,
            playlistTracks.map((track) => track.id),
            false
          );
        },
      },
    });

    // Add To Play Next Queue
    menuItems.push({
      key: 'addToPNQueue',
      label: t('dropdown.playlist.AddToPlayNextQueue'),
      icon: nCreateDropdownIcon('mdi-playlist-play'),
      disabled: !availablePlaylistTracks?.length,
      props: {
        onClick: (): void => {
          delayedCloseMenu();
          if (!availablePlaylistTracks?.length || !playlistTracks?.length) {
            return;
          }
          playbackStore.appendTracksToPlayNextQueue$$q(
            playlistTracks.map((track) => track.id)
          );
          message.success(
            t('message.n_AddedToPlayNextQueue', playlistTracks.length)
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
    if (openEditPlaylistDialog$$q) {
      menuItems.push({
        key: 'edit',
        label: t('dropdown.playlist.Edit'),
        icon: nCreateDropdownIcon('mdi-pencil'),
        props: {
          onClick: (): void => {
            delayedCloseMenu();
            openEditPlaylistDialog$$q();
          },
        },
      });
    }

    // Delete
    menuItems.push({
      key: 'delete',
      label: t('dropdown.playlist.Delete'),
      icon: nCreateDropdownIcon('mdi-delete'),
      props: {
        style: nCreateDropdownTextColorStyle('error'),
        onClick: (): void => {
          delayedCloseMenu();
          dialog.error({
            title: t('dialog.deletePlaylist.title'),
            content: nCreateDialogContentWithWarning(
              () => t('dialog.deletePlaylist.content', [playlist.title]),
              () => t('common.ThisActionCannotBeUndone')
            ),
            positiveText: t('dialog.deletePlaylist.button.Delete'),
            negativeText: t('dialog.deletePlaylist.button.Cancel'),
            onPositiveClick: () => {
              api.my.playlists
                ._playlistId(playlistId)
                .$delete()
                .then(() => {
                  setRedirect(`/playlists/${playlistId}`, '/playlists');
                  message.success(
                    t('message.DeletedPlaylist', [playlist.title])
                  );
                  syncDB();
                })
                .catch((error) => {
                  message.error(
                    t('message.FailedToDeletePlaylist', [
                      playlist.title,
                      String(error),
                    ])
                  );
                });
            },
          });
        },
      },
    });

    if (openCreatePlaylistDialog$$q && showCreatePlaylist$$q.value) {
      // --- divider ---
      menuItems.push({
        key: 'div2',
        type: 'divider',
      });

      // Create
      menuItems.push({
        key: 'create',
        label: t('dropdown.playlist.Create'),
        icon: nCreateDropdownIcon('mdi-plus'),
        props: {
          onClick: (): void => {
            delayedCloseMenu();
            openCreatePlaylistDialog$$q();
          },
        },
      });
    }

    return menuItems;
  });
}
