import { MenuOption, useDialog, useMessage } from 'naive-ui';
import type { ComputedRef, Ref } from 'vue';
import type { ResourcePlaylist, ResourceTrack } from '$/types';
import { useSyncDB } from '~/db/sync';
import api from '~/logic/api';
import { usePlaybackStore } from '~/stores/playback';
import { nCreateDropdownIcon, nCreateDropdownTextColorStyle } from './dropdown';

interface PlaylistDropdownCreateOptions {
  readonly playlist$$q: Readonly<Ref<ResourcePlaylist | null | undefined>>;
  readonly playlistTracks$$q: Readonly<
    Ref<readonly ResourceTrack[] | null | undefined>
  >;
  readonly moveWhenDelete$$q: Readonly<Ref<boolean>>;
  readonly openEditPlaylistDialog$$q: () => void;
  readonly openCreatePlaylistDialog$$q?: () => void;
  readonly closeMenu$$q: () => void;
}

export function createPlaylistDropdown({
  playlist$$q,
  playlistTracks$$q,
  moveWhenDelete$$q,
  openEditPlaylistDialog$$q,
  openCreatePlaylistDialog$$q,
  closeMenu$$q,
}: PlaylistDropdownCreateOptions): ComputedRef<MenuOption[]> {
  const { t } = useI18n();
  const router = useRouter();
  const dialog = useDialog();
  const message = useMessage();
  const syncDB = useSyncDB();
  const playbackStore = usePlaybackStore();

  return computed((): MenuOption[] => {
    if (!playlist$$q.value) {
      return [];
    }

    const playlist = playlist$$q.value;
    const playlistId = playlist$$q.value.id;
    const playlistTracks = playlistTracks$$q.value;

    const menuItems: MenuOption[] = [];

    // Add To Play Next Queue
    menuItems.push({
      key: 'addToPNQueue',
      label: t('dropdown.playlist.AddToPlayNextQueue'),
      icon: nCreateDropdownIcon('mdi-playlist-play'),
      disabled: !playlistTracks?.length,
      props: {
        onClick: (): void => {
          closeMenu$$q();
          if (!playlistTracks?.length) {
            return;
          }
          playbackStore.appendTracksToPlayNextQueue$$q(playlistTracks);
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
    menuItems.push({
      key: 'edit',
      label: t('dropdown.playlist.Edit'),
      icon: nCreateDropdownIcon('mdi-pencil'),
      props: {
        onClick: (): void => {
          openEditPlaylistDialog$$q();
          closeMenu$$q();
        },
      },
    });

    // Delete
    menuItems.push({
      key: 'delete',
      label: t('dropdown.playlist.Delete'),
      icon: nCreateDropdownIcon('mdi-delete'),
      props: {
        style: nCreateDropdownTextColorStyle('error'),
        onClick: (): void => {
          dialog.error({
            title: t('dialog.deletePlaylist.title'),
            content: t('dialog.deletePlaylist.content', [playlist.title]),
            positiveText: t('dialog.deletePlaylist.button.Delete'),
            negativeText: t('dialog.deletePlaylist.button.Cancel'),
            onPositiveClick: () => {
              api.my.playlists
                ._playlistId(playlistId)
                .$delete()
                .then(() => {
                  message.success(
                    t('message.DeletedPlaylist', [playlist.title])
                  );
                  syncDB();
                  if (moveWhenDelete$$q.value) {
                    router.replace('/playlists');
                  }
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
          closeMenu$$q();
        },
      },
    });

    if (openCreatePlaylistDialog$$q) {
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
            openCreatePlaylistDialog$$q();
            closeMenu$$q();
          },
        },
      });
    }

    return menuItems;
  });
}
