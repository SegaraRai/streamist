import { MenuOption, useDialog, useMessage } from 'naive-ui';
import type { ComputedRef, Ref } from 'vue';
import type { ResourceTrack } from '$/types';
import { useSyncDB } from '~/db/sync';
import api from '~/logic/api';
import { usePlaybackStore } from '~/stores/playback';
import { useAllPlaylists } from '../useDB';
import { nCreateDropdownIcon, nCreateDropdownTextColorStyle } from './dropdown';

interface TrackListDropdownCreateOptions {
  readonly selectedTrack$$q: Readonly<Ref<ResourceTrack | null | undefined>>;
  readonly playlistId$$q: Readonly<Ref<string | null | undefined>>;
  readonly showVisitAlbum$$q: Readonly<Ref<boolean>>;
  readonly showVisitArtist$$q: Readonly<Ref<boolean>>;
  readonly showPlayback$$q: Readonly<Ref<boolean>>;
  readonly play$$q: (track: ResourceTrack) => void;
  readonly openEditTrackDialog$$q: (track: ResourceTrack) => void;
  readonly closeMenu$$q: () => void;
}

export function createTrackListDropdown({
  selectedTrack$$q,
  playlistId$$q,
  showVisitAlbum$$q,
  showVisitArtist$$q,
  showPlayback$$q,
  play$$q,
  openEditTrackDialog$$q,
  closeMenu$$q,
}: TrackListDropdownCreateOptions): ComputedRef<MenuOption[]> {
  const router = useRouter();
  const { t } = useI18n();
  const dialog = useDialog();
  const message = useMessage();
  const syncDB = useSyncDB();
  const playbackStore = usePlaybackStore();
  const allPlaylist = useAllPlaylists();

  return computed(() => {
    if (!selectedTrack$$q.value) {
      return [];
    }

    const track = selectedTrack$$q.value;
    const trackId = selectedTrack$$q.value.id;

    const currentPlayingTrackId = playbackStore.currentTrack$$q.value?.id;
    const isPlayingThisTrack =
      playbackStore.playing$$q.value && trackId === currentPlayingTrackId;

    const playlists = allPlaylist.value.value || [];
    const removeFromPlaylist = playlistId$$q.value
      ? playlists.find((p) => p.id === playlistId$$q.value)
      : undefined;

    const menuItems: MenuOption[] = [];

    if (showPlayback$$q.value) {
      // Play
      menuItems.push({
        key: 'play',
        label: isPlayingThisTrack
          ? t('dropdown.trackList.Pause')
          : t('dropdown.trackList.Play'),
        icon: nCreateDropdownIcon(() =>
          // NOTE: we have to access to ref directly in the render function to make icon reactive
          playbackStore.playing$$q.value &&
          trackId === playbackStore.currentTrack$$q.value?.id
            ? 'mdi-pause'
            : 'mdi-play'
        ),
        props: {
          onClick: () => {
            if (playbackStore.currentTrack$$q.value?.id === trackId) {
              playbackStore.playing$$q.value = !playbackStore.playing$$q.value;
            } else {
              play$$q(track);
            }
            closeMenu$$q();
          },
        },
      });

      // Add To Play Next Queue
      menuItems.push({
        key: 'addToPNQueue',
        label: t('dropdown.trackList.AddToPlayNextQueue'),
        icon: nCreateDropdownIcon('mdi-playlist-play'),
        props: {
          onClick: () => {
            closeMenu$$q();
            playbackStore.appendTracksToPlayNextQueue$$q([track]);
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

    // Visit Album
    if (showVisitAlbum$$q.value) {
      menuItems.push({
        key: 'goToAlbum',
        label: t('dropdown.trackList.GoToAlbum'),
        icon: nCreateDropdownIcon('mdi-album'),
        props: {
          onClick: () => {
            closeMenu$$q();
            router.push(`/albums/${track.albumId}`);
          },
        },
      });
    }

    // Visit Artist
    if (showVisitArtist$$q.value) {
      menuItems.push({
        key: 'goToArtist',
        label: t('dropdown.trackList.GoToArtist'),
        icon: nCreateDropdownIcon('mdi-account-music'),
        props: {
          onClick: () => {
            closeMenu$$q();
            router.push(`/artists/${track.artistId}`);
          },
        },
      });
    }

    // --- divider ---
    if (showVisitAlbum$$q.value || showVisitArtist$$q.value) {
      menuItems.push({
        key: 'div2',
        type: 'divider',
      });
    }

    // Add to Playlist
    menuItems.push({
      key: 'addToPlaylist',
      label: t('dropdown.trackList.AddToPlaylist'),
      icon: nCreateDropdownIcon('mdi-playlist-plus'),
      disabled: !playlists.length,
      children: [
        {
          key: 'addToPlaylist.createNew',
          label: t('dropdown.trackList.AddToNewPlaylist'),
          props: {
            onClick: () => {
              closeMenu$$q();

              api.my.playlists
                .$post({
                  body: {
                    title: track.title,
                    notes: '',
                    trackIds: [track.id],
                  },
                })
                .then(() => {
                  message.success(t('message.CreatedPlaylist', [track.title]));
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
        {
          key: 'addToPlaylist.div',
          type: 'divider',
        },
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

                closeMenu$$q();

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

    // Remove from Playlist
    if (removeFromPlaylist) {
      menuItems.push({
        key: `removeFromPlaylist.${removeFromPlaylist.id}`,
        label: t('dropdown.trackList.RemoveFromPlaylist'),
        icon: nCreateDropdownIcon('mdi-playlist-remove'),
        props: {
          onClick: () => {
            closeMenu$$q();
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
        },
      });
    }

    // --- divider ---
    menuItems.push({
      key: 'div3',
      type: 'divider',
    });

    // Edit
    menuItems.push({
      key: 'edit',
      label: t('dropdown.trackList.Edit'),
      icon: nCreateDropdownIcon('mdi-pencil'),
      props: {
        onClick: () => {
          openEditTrackDialog$$q(track);
          closeMenu$$q();
        },
      },
    });

    // Delete
    menuItems.push({
      key: 'delete',
      label: t('dropdown.trackList.Delete'),
      icon: nCreateDropdownIcon('mdi-delete'),
      props: {
        style: nCreateDropdownTextColorStyle('error'),
        onClick: () => {
          dialog.error({
            icon: nCreateDropdownIcon('mdi-alert-circle', {
              style: 'font-size: inherit',
            }),
            title: t('dialog.deleteTrack.title'),
            content: t('dialog.deleteTrack.content', [track.title]),
            positiveText: t('dialog.deleteTrack.button.Delete'),
            negativeText: t('dialog.deleteTrack.button.Cancel'),
            onPositiveClick: () => {
              api.my.tracks
                ._trackId(trackId)
                .$delete()
                .then(() => {
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
          closeMenu$$q();
        },
      },
    });

    // debug menu
    if (import.meta.env.DEV) {
      // --- divider ---
      menuItems.push({
        key: 'debug-div',
        type: 'divider',
      });

      // remove track
      menuItems.push({
        key: 'debug-remove',
        label: '# Remove',
        icon: nCreateDropdownIcon('mdi-minus'),
        props: {
          onClick: () => {
            playbackStore.debugRemoveTrack$$q(trackId);
            closeMenu$$q();
          },
        },
      });
    }

    return menuItems;
  });
}
