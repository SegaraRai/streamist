import { MenuOption, useDialog, useMessage } from 'naive-ui';
import type { ComputedRef, Ref } from 'vue';
import { useDisplay } from 'vuetify';
import type { ResourceTrack } from '$/types';
import { useSyncDB } from '~/db';
import { api } from '~/logic/api';
import { nCreateDialogContentWithWarning } from '~/logic/naiveUI/dialog';
import {
  nCreateDropdownIcon,
  nCreateDropdownTextColorStyle,
} from '~/logic/naiveUI/dropdown';
import { usePlaybackStore } from '~/stores/playback';
import { setRedirect } from '~/stores/redirect';
import { useAllPlaylists } from '../useDB';
import { useTrackFilter } from '../useTrackFilter';
import { cleanupDividers } from './utils';

export interface NDropdownTrackCreateOptions {
  readonly selectedTrack$$q: Readonly<Ref<ResourceTrack | null | undefined>>;
  readonly isSameSetList$$q: Readonly<Ref<boolean>>;
  readonly playlistId$$q: Readonly<Ref<string | null | undefined>>;
  readonly showVisitAlbum$$q: Readonly<Ref<boolean>>;
  readonly showVisitArtist$$q: Readonly<Ref<boolean>>;
  readonly showPlayback$$q: Readonly<Ref<boolean>>;
  readonly showDelete$$q: Readonly<Ref<boolean>>;
  readonly play$$q: (track: ResourceTrack) => void;
  readonly openEditTrackDialog$$q?: (track: ResourceTrack) => void;
  readonly openTrackDetailsDialog$$q?: (track: ResourceTrack) => void;
  readonly openAddToPlaylistDialog$$q?: (track: ResourceTrack) => void;
  readonly onNavigate$$q?: () => void;
  readonly closeMenu$$q: () => void;
}

export function useNDropdownTrack({
  selectedTrack$$q,
  isSameSetList$$q,
  playlistId$$q,
  showVisitAlbum$$q,
  showVisitArtist$$q,
  showPlayback$$q,
  showDelete$$q,
  play$$q,
  openEditTrackDialog$$q,
  openTrackDetailsDialog$$q,
  openAddToPlaylistDialog$$q,
  onNavigate$$q,
  closeMenu$$q,
}: NDropdownTrackCreateOptions): ComputedRef<MenuOption[]> {
  const router = useRouter();
  const { t } = useI18n();
  const display = useDisplay();
  const dialog = useDialog();
  const message = useMessage();
  const syncDB = useSyncDB();
  const playbackStore = usePlaybackStore();
  const allPlaylist = useAllPlaylists();
  const { isTrackAvailable$$q } = useTrackFilter();

  const delayedCloseMenu = (): void => {
    setTimeout((): void => closeMenu$$q(), 0);
  };

  return computed(() => {
    if (!selectedTrack$$q.value) {
      return [];
    }

    const track = selectedTrack$$q.value;
    const trackId = selectedTrack$$q.value.id;

    const isAvailable = isTrackAvailable$$q(trackId);

    const currentPlayingTrackId = playbackStore.currentTrack$$q.value;
    const isPlayingThisTrack =
      isSameSetList$$q.value &&
      playbackStore.playing$$q.value &&
      trackId === currentPlayingTrackId;

    const playlists = allPlaylist.value.value || [];
    const removeFromPlaylist = playlistId$$q.value
      ? playlists.find((p) => p.id === playlistId$$q.value)
      : undefined;

    const noNestedItems = display.smAndDown.value;

    const menuItems: MenuOption[] = [];

    if (showPlayback$$q.value) {
      // Play
      menuItems.push({
        key: 'play',
        disabled: !isAvailable,
        label: isPlayingThisTrack
          ? t('dropdown.track.Pause')
          : t('dropdown.track.Play'),
        icon: nCreateDropdownIcon(() =>
          // NOTE: we have to access to ref directly in the render function to make icon reactive
          isSameSetList$$q.value &&
          playbackStore.playing$$q.value &&
          trackId === playbackStore.currentTrack$$q.value
            ? 'mdi-pause'
            : 'mdi-play'
        ),
        props: {
          onClick: () => {
            if (!isAvailable) {
              return;
            }

            delayedCloseMenu();
            play$$q(track);
          },
        },
      });

      // Add To Play Next Queue
      menuItems.push({
        key: 'addToPNQueue',
        disabled: !isAvailable,
        label: t('dropdown.track.AddToPlayNextQueue'),
        icon: nCreateDropdownIcon('mdi-playlist-play'),
        props: {
          onClick: () => {
            if (!isAvailable) {
              return;
            }

            delayedCloseMenu();
            playbackStore.appendTracksToPlayNextQueue$$q([track.id]);
            message.success(t('message.AddedToPlayNextQueue', [track.title]));
          },
        },
      });

      // TODO: Remove from Play Next Queue
      // TODO: Remove from Queue

      // --- divider ---
      menuItems.push({
        key: 'div1',
        type: 'divider',
      });
    }

    if (
      showVisitAlbum$$q.value ||
      showVisitArtist$$q.value ||
      openTrackDetailsDialog$$q
    ) {
      // Visit Album
      if (showVisitAlbum$$q.value) {
        menuItems.push({
          key: 'goToAlbum',
          label: t('dropdown.track.GoToAlbum'),
          icon: nCreateDropdownIcon('mdi-album'),
          props: {
            onClick: () => {
              delayedCloseMenu();
              router.push(`/albums/${track.albumId}`);
              onNavigate$$q?.();
            },
          },
        });
      }

      // Visit Artist
      if (showVisitArtist$$q.value) {
        menuItems.push({
          key: 'goToArtist',
          label: t('dropdown.track.GoToArtist'),
          icon: nCreateDropdownIcon('mdi-account-music'),
          props: {
            onClick: () => {
              delayedCloseMenu();
              router.push(`/artists/${track.artistId}`);
              onNavigate$$q?.();
            },
          },
        });
      }

      if (openTrackDetailsDialog$$q) {
        menuItems.push({
          key: 'details',
          label: t('dropdown.track.ShowDetails'),
          icon: nCreateDropdownIcon('mdi-menu'),
          props: {
            onClick: () => {
              delayedCloseMenu();
              openTrackDetailsDialog$$q?.(track);
            },
          },
        });
      }

      // --- divider ---
      menuItems.push({
        key: 'div2',
        type: 'divider',
      });
    }

    // Add to Playlist
    if (noNestedItems) {
      if (openAddToPlaylistDialog$$q) {
        menuItems.push({
          key: 'addToPlaylist',
          label: t('dropdown.track.AddToPlaylist'),
          icon: nCreateDropdownIcon('mdi-playlist-plus'),
          props: {
            onClick: (): void => {
              delayedCloseMenu();
              openAddToPlaylistDialog$$q?.(track);
            },
          },
        });
      }
    } else {
      menuItems.push({
        key: 'addToPlaylist',
        label: t('dropdown.track.AddToPlaylist'),
        icon: nCreateDropdownIcon('mdi-playlist-plus'),
        children: [
          {
            key: 'addToPlaylist.createNew',
            label: t('dropdown.track.AddToNewPlaylist'),
            props: {
              onClick: () => {
                delayedCloseMenu();

                api.my.playlists
                  .$post({
                    body: {
                      title: track.title,
                      description: '',
                      trackIds: [track.id],
                    },
                  })
                  .then(() => {
                    message.success(
                      t('message.CreatedPlaylist', [track.title])
                    );
                    syncDB();
                  })
                  .catch((error) => {
                    message.error(
                      t('message.FailedToCreatePlaylist', [
                        track.title,
                        String(error),
                      ])
                    );
                  });
              },
            },
          },
          ...(playlists.length
            ? [
                {
                  key: 'addToPlaylist.div',
                  type: 'divider',
                },
              ]
            : []),
          ...playlists.map((playlist) => {
            const disabled = playlist.trackIds.includes(trackId);
            return {
              key: `addToPlaylist.id-${playlist.id}`,
              label: playlist.title,
              disabled,
              props: {
                onClick: () => {
                  if (disabled) {
                    return;
                  }

                  delayedCloseMenu();

                  api.my.playlists
                    ._playlistId(playlist.id)
                    .tracks.$post({
                      body: {
                        trackIds: [trackId],
                      },
                    })
                    .then(() => {
                      message.success(
                        t('message.AddedToPlaylist', [
                          playlist.title,
                          track.title,
                        ])
                      );
                      syncDB();
                    })
                    .catch((error) => {
                      message.error(
                        t('message.FailedToAddToPlaylist', [
                          playlist.title,
                          track.title,
                          String(error),
                        ])
                      );
                    });
                },
              },
            };
          }),
        ],
      });
    }

    // Remove from Playlist
    if (removeFromPlaylist) {
      menuItems.push({
        key: `removeFromPlaylist.${removeFromPlaylist.id}`,
        label: t('dropdown.track.RemoveFromPlaylist'),
        icon: nCreateDropdownIcon('mdi-playlist-remove'),
        props: {
          style: nCreateDropdownTextColorStyle('warning'),
          onClick: () => {
            delayedCloseMenu();
            dialog.warning({
              title: t('dialog.removeFromPlaylist.title'),
              content: t('dialog.removeFromPlaylist.content', [
                removeFromPlaylist.title,
                track.title,
              ]),
              positiveText: t('dialog.removeFromPlaylist.button.Remove'),
              negativeText: t('dialog.removeFromPlaylist.button.Cancel'),
              onPositiveClick: () => {
                api.my.playlists
                  ._playlistId(removeFromPlaylist.id)
                  .tracks._trackId(trackId)
                  .$delete()
                  .then(() => {
                    message.success(
                      t('message.RemovedFromPlaylist', [
                        removeFromPlaylist.title,
                        track.title,
                      ])
                    );
                    syncDB();
                  })
                  .catch((error) => {
                    message.error(
                      t('message.FailedToRemoveFromPlaylist', [
                        removeFromPlaylist.title,
                        track.title,
                        String(error),
                      ])
                    );
                  });
              },
            });
          },
        },
      });
    }

    if (openEditTrackDialog$$q || showDelete$$q.value) {
      // --- divider ---
      menuItems.push({
        key: 'div3',
        type: 'divider',
      });

      // Edit
      if (openEditTrackDialog$$q) {
        menuItems.push({
          key: 'edit',
          label: t('dropdown.track.Edit'),
          icon: nCreateDropdownIcon('mdi-pencil'),
          props: {
            onClick: () => {
              delayedCloseMenu();
              openEditTrackDialog$$q(track);
            },
          },
        });
      }

      // Delete
      if (showDelete$$q.value) {
        menuItems.push({
          key: 'delete',
          label: t('dropdown.track.Delete'),
          icon: nCreateDropdownIcon('mdi-delete'),
          props: {
            style: nCreateDropdownTextColorStyle('error'),
            onClick: () => {
              delayedCloseMenu();
              dialog.error({
                icon: nCreateDropdownIcon('mdi-alert-circle', {
                  style: 'font-size: inherit',
                }),
                title: t('dialog.deleteTrack.title'),
                content: nCreateDialogContentWithWarning(
                  () => t('dialog.deleteTrack.content', [track.title]),
                  () => t('common.ThisActionCannotBeUndone')
                ),
                positiveText: t('dialog.deleteTrack.button.Delete'),
                negativeText: t('dialog.deleteTrack.button.Cancel'),
                onPositiveClick: () => {
                  api.my.tracks
                    ._trackId(trackId)
                    .$delete()
                    .then(() => {
                      setRedirect(`/albums/${track.albumId}`, '/albums');
                      setRedirect(`/artists/${track.artistId}`, '/artists');
                      message.success(t('message.DeletedTrack', [track.title]));
                      syncDB();
                    })
                    .catch((error) => {
                      message.error(
                        t('message.FailedToDeleteTrack', [
                          track.title,
                          String(error),
                        ])
                      );
                    });
                },
              });
            },
          },
        });
      }
    }

    return cleanupDividers(menuItems);
  });
}
