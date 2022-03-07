import type { RepeatType, WSPlaybackState } from '$shared/types';
import type { ResourceTrack } from '$/types';
import defaultAlbumArt from '~/assets/default_album_art_256x256.png?url';
import {
  useAccurateTime,
  useLiveQuery,
  useRecentlyPlayed,
  useTrackFilter,
  useWS,
  useWSListener,
} from '~/composables';
import {
  SEEK_BACKWARD_TIME,
  SEEK_FORWARD_TIME,
  SEEK_TO_BEGINNING_THRESHOLD,
} from '~/config';
import { db } from '~/db';
import { getBestTrackFileURL } from '~/logic/audio';
import { needsCDNCookie, setCDNCookie } from '~/logic/cdnCookie';
import { getImageFileURL } from '~/logic/fileURL';
import { getUserId } from '~/logic/tokens';
import { TrackProvider2 } from '~/logic/trackProvider2';
import {
  realVolumeToVisualVolume,
  visualVolumeToRealVolume,
} from '~/logic/volume';
import { usePreferenceStore } from './preference';
import { useVolumeStore } from './volume';

const audioContainer = document.body;

async function createMetadataInit(
  userId: string,
  track: ResourceTrack
): Promise<MediaMetadataInit> {
  const album = await db.albums.get(track.albumId);
  const artist = await db.artists.get(track.artistId);

  if (!userId) {
    throw new Error('userId not found (db corrupted)');
  }

  if (!album || !artist) {
    throw new Error('album or artist not found (db corrupted)');
  }

  const image =
    album.imageIds.length > 0
      ? await db.images.get(album.imageIds[0])
      : undefined;

  const artwork: MediaImage[] = image
    ? image.files.map((imageFile) => ({
        src: getImageFileURL(userId, image.id, imageFile),
        sizes: `${imageFile.width}x${imageFile.height}`,
        type: imageFile.mimeType,
      }))
    : [
        {
          src: defaultAlbumArt,
          sizes: '256x256',
          type: 'image/png',
        },
      ];

  return {
    title: track.title,
    artist: artist.name,
    album: album.title,
    artwork,
  };
}

function _usePlaybackStore() {
  const volumeStore = useVolumeStore();
  const { isTrackAvailable$$q, serializedFilterKey$$q } = useTrackFilter();
  const { addRecentlyPlayedTrack$$q } = useRecentlyPlayed();
  const preferenceStore = usePreferenceStore();
  const { sessionType$$q, sendWS$$q } = useWS();
  const { getAccurateTime, accurateTimeDiff } = useAccurateTime();

  const remotePlaybackState = ref<WSPlaybackState | undefined>();

  // WS

  let processingConnectedEvent = false;
  let processingUpdatedEvent = false;

  useWSListener('connected', (data): void => {
    processingConnectedEvent = true;
    try {
      remotePlaybackState.value = data.pbState ?? undefined;
      internalRemoteSeekingPosition.value = undefined;
      if (data.pbTracks) {
        trackProvider.import$$q(data.pbTracks);
        currentSetListName.value = data.pbTracks.setListName;
      }
    } finally {
      processingConnectedEvent = false;
    }
  });

  useWSListener('updated', (data): void => {
    processingUpdatedEvent = true;
    try {
      const { byYou } = data;

      const isHost = sessionType$$q.value === 'host';

      // update state
      if (data.pbState !== undefined) {
        remotePlaybackState.value = data.pbState ?? undefined;
        internalRemoteSeekingPosition.value = undefined;
      }

      // update trackProvider
      if (!byYou) {
        if (data.pbTracks !== undefined) {
          if (data.pbTracks) {
            trackProvider.import$$q(data.pbTracks, data.pbTrackChange ?? false);
            currentSetListName.value = data.pbTracks.setListName;
          }
        }
      }

      // apply state
      if (data.pbState && !data.pbTrackChange && isHost && !byYou) {
        playing.value = data.pbState.playing;
        position.value = calcPositionFromState(data.pbState, getAccurateTime());
      }
    } finally {
      processingUpdatedEvent = false;
    }
  });

  //

  const repeat = useLocalStorage<RepeatType>('playback.repeat', 'off');
  const shuffle = useLocalStorage<boolean>('playback.shuffle', false);
  const showRemainingTime = useLocalStorage<boolean>(
    'playback.showRemainingTime',
    false
  );

  let currentAudio: HTMLAudioElement | undefined;

  const trackProvider = new TrackProvider2();

  const internalSeekingPosition = ref<number | undefined>();
  const internalRemoteSeekingPosition = ref<number | undefined>();
  const internalPosition = ref<number | undefined>();
  const timestampRef = useTimestamp();
  const accurateTimeRef = computed(
    () => timestampRef.value + accurateTimeDiff.value
  );
  const calcPositionFromState = (
    state: WSPlaybackState,
    accurateTime: number
  ): number =>
    Math.min(
      Math.max(
        state.startPosition +
          (state.playing ? (accurateTime - state.startedAt) / 1000 : 0),
        0
      ),
      state.duration
    );
  const position = computed<number | undefined>({
    get: (): number | undefined => {
      // note that position may exist even if sessionType is 'none'
      if (sessionType$$q.value !== 'host') {
        const remoteState = remotePlaybackState.value;
        if (!remoteState) {
          return undefined;
        }
        return (
          internalRemoteSeekingPosition.value ??
          calcPositionFromState(remoteState, accurateTimeRef.value)
        );
      }
      return internalSeekingPosition.value ?? internalPosition.value;
    },
    set: (value: number | undefined): void => {
      if (value == null) {
        return;
      }

      const byRemote = processingConnectedEvent || processingUpdatedEvent;

      const duration =
        sessionType$$q.value === 'host'
          ? currentAudio?.duration
          : remotePlaybackState.value?.duration;

      if (duration == null || !isFinite(duration)) {
        console.error('duration is null or not finite');
        return;
      }

      value = Math.max(0, Math.min(value, duration));

      if (sessionType$$q.value === 'host') {
        if (!currentAudio) {
          return;
        }

        internalSeekingPosition.value = value;
        currentAudio.currentTime = value;
      }

      if (!byRemote) {
        internalRemoteSeekingPosition.value = value;

        // skip sending if host because it will be sent by 'seeked' event handler
        if (sessionType$$q.value !== 'host') {
          sendWS$$q(
            [
              {
                type: 'setState',
                duration,
                position: value,
                playing: playing.value,
                timestamp: getAccurateTime(),
              },
            ],
            true
          );
        }
      }
    },
  });

  const currentTrackId = ref<string | undefined>();
  const currentTrack = useLiveQuery(
    async () =>
      currentTrackId.value
        ? await db.tracks.get(currentTrackId.value)
        : undefined,
    [currentTrackId]
  );
  const queue = ref<string[]>([]);
  const playNextQueue = ref<string[]>([]);

  const currentSetListName = ref<string>('');
  const currentSetList = ref<readonly string[] | undefined>();
  const defaultSetListName = ref<string>('');
  const defaultSetList = ref<readonly string[] | undefined>();

  const internalPlaying = ref<boolean>(false);
  const playing = computed<boolean>({
    get: (): boolean => {
      if (sessionType$$q.value === 'none') {
        return false;
      }
      if (
        sessionType$$q.value !== 'host' &&
        remotePlaybackState.value != null
      ) {
        return remotePlaybackState.value.playing;
      }
      return internalPlaying.value;
    },
    set: (value: boolean): void => {
      const audio = currentAudio;
      const byRemote = processingConnectedEvent || processingUpdatedEvent;

      const currentValue = playing.value;
      if (value === currentValue) {
        return;
      }

      if (value && !currentTrackId.value) {
        playNext();
        return;
      }

      const duration =
        sessionType$$q.value === 'host'
          ? audio?.duration
          : remotePlaybackState.value?.duration;
      const position =
        sessionType$$q.value === 'host'
          ? audio?.currentTime
          : remotePlaybackState.value &&
            calcPositionFromState(remotePlaybackState.value, getAccurateTime());

      if (
        duration == null ||
        !isFinite(duration) ||
        position == null ||
        !isFinite(position)
      ) {
        console.error('duration or position is null or not finite');
        return;
      }

      if (sessionType$$q.value === 'host') {
        if (!audio) {
          return;
        }

        internalPlaying.value = value;

        if (value) {
          (async (): Promise<void> => {
            if (needsCDNCookie(audio.src)) {
              await setCDNCookie();
            }
            if (currentAudio === audio) {
              await audio.play();
            }
          })();
        } else {
          audio.pause();
        }

        // skip sending play/pause because it will be sent by 'play' and 'pause' event handler
        return;
      }

      // do nothing if not host and triggered by remote
      if (byRemote) {
        return;
      }

      // if there is no host, play tracks in this session
      if (sessionType$$q.value === 'none' && !byRemote && value) {
        setTimeout((): void => playTrack(value, position), 0);
      } else {
        // otherwise, send play/pause (to host and other sessions)
        sendWS$$q(
          [
            {
              type: 'setState',
              duration,
              position,
              playing: value,
              timestamp: getAccurateTime(),
            },
          ],
          true
        );
      }
    },
  });

  const seekBy = (diff: number): void => {
    if (position.value == null) {
      return;
    }

    position.value = position.value + diff;
  };

  const goPrevious = (): void => {
    if (
      currentAudio &&
      position.value != null &&
      position.value >= SEEK_TO_BEGINNING_THRESHOLD
    ) {
      position.value = 0;
      return;
    }

    trackProvider.skipPrevious$$q();
  };

  const setMediaSessionActionHandlers = (): void => {
    navigator.mediaSession.setActionHandler('play', (): void => {
      playing.value = true;
    });

    navigator.mediaSession.setActionHandler('pause', (): void => {
      playing.value = false;
    });

    navigator.mediaSession.setActionHandler('previoustrack', (): void => {
      goPrevious();
    });

    navigator.mediaSession.setActionHandler('nexttrack', (): void => {
      trackProvider.skipNext$$q();
    });

    navigator.mediaSession.setActionHandler('seekforward', (event): void => {
      seekBy(event.seekOffset || SEEK_FORWARD_TIME);
    });

    navigator.mediaSession.setActionHandler('seekbackward', (event): void => {
      seekBy(-(event.seekOffset || SEEK_BACKWARD_TIME));
    });

    try {
      navigator.mediaSession.setActionHandler('seekto', (event): void => {
        const { seekTime } = event;
        if (!currentAudio || seekTime == null) {
          return;
        }
        if (event.fastSeek && 'fastSeek' in currentAudio) {
          currentAudio.fastSeek(seekTime);
          return;
        }
        internalSeekingPosition.value = seekTime;
        currentAudio.currentTime = seekTime;
        navigator.mediaSession.setPositionState({
          duration: currentAudio.duration,
          playbackRate: currentAudio.playbackRate,
          position: seekTime,
        });
      });
    } catch (error) {
      console.warn(
        'Warning! The "seekto" media session action is not supported.'
      );
    }
  };

  const clearMediaSession = (): void => {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('stop', null);
    navigator.mediaSession.setActionHandler('previoustrack', null);
    navigator.mediaSession.setActionHandler('nexttrack', null);
    navigator.mediaSession.setActionHandler('seekto', null);
  };

  const createAudio = (): HTMLAudioElement => {
    const audio = new Audio();
    audio.classList.add('currentTrack');
    audio.classList.add('preparing');
    audio.volume = visualVolumeToRealVolume(volumeStore.volume);

    // console.info('create', audio);

    const sendState = (playing = !audio.paused): void => {
      if (
        !audio.src ||
        !isFinite(audio.duration) ||
        !isFinite(audio.currentTime)
      ) {
        console.warn(
          'audio.src is null or audio.duration or audio.currentTime is not finite'
        );
        return;
      }

      sendWS$$q(
        [
          {
            type: 'setState',
            duration: audio.duration,
            position: audio.currentTime,
            playing,
            timestamp: getAccurateTime(),
          },
        ],
        true
      );
    };

    audio.onplay = (): void => {
      if (currentAudio !== audio) {
        console.info('ignoring play', currentAudio, audio);
        return;
      }

      internalPlaying.value = true;

      // skip sending 'play' event as it is already sent by 'trackChange' event handler
      if (!audio.classList.contains('preparing')) {
        sendState(true);
      }
    };

    audio.onpause = (): void => {
      if (currentAudio !== audio) {
        console.info('ignoring pause', currentAudio, audio);
        return;
      }

      internalPlaying.value = false;
      sendState(false);
    };

    audio.onseeked = (): void => {
      if (currentAudio !== audio) {
        console.info('ignoring seeked', currentAudio, audio);
        return;
      }

      internalSeekingPosition.value = undefined;
      internalPosition.value = audio.currentTime;
      sendState();
    };

    audio.ontimeupdate = (): void => {
      if (currentAudio !== audio || audio.seeking) {
        console.info('ignoring timeupdate', currentAudio, audio, audio.seeking);
        return;
      }

      internalPosition.value = audio.currentTime;
    };

    audio.onended = (): void => {
      if (currentAudio !== audio) {
        console.info('ignoring ended', currentAudio, audio);
        return;
      }

      trackProvider.next$$q();
    };

    audio.onvolumechange = (): void => {
      if (currentAudio !== audio) {
        console.info('ignoring volumechange', currentAudio, audio);
        return;
      }

      const vol = realVolumeToVisualVolume(audio.volume);

      if (volumeStore.volume === vol) {
        // this is needed to suppress update of unmutedVolume
        return;
      }
      volumeStore.volume = vol;
    };

    return audio;
  };

  const cleanupAudio = (audio: HTMLAudioElement): void => {
    // console.info('cleanup', audio, currentAudio);

    audio.onplay = null;
    audio.onpause = null;
    audio.onseeked = null;
    audio.ontimeupdate = null;
    audio.onended = null;
    audio.onvolumechange = null;
  };

  const setSetListAndPlay = (
    name: string,
    trackIds: readonly string[],
    trackId?: string | null
  ): void => {
    if (trackId && !isTrackAvailable$$q(trackId)) {
      return;
    }
    trackIds = trackIds.filter((trackId) => isTrackAvailable$$q(trackId));
    if (trackId) {
      addRecentlyPlayedTrack$$q(trackId);
    }
    currentSetListName.value = name;
    currentSetList.value = trackIds;
    internalPosition.value = trackIds.length ? 0 : undefined;
    // NOTE: `setSetList$$q`に渡す`currentTrack`（第2引数）は`null`と`undefined`で挙動が異なる
    trackProvider.setSetList$$q(trackIds, trackIds.length ? trackId : null);
    // we don't have to manipulate playing and position here, because `trackChange` event handler will do it
  };

  const setSetListAndPlayAuto = (
    name: string,
    trackIds: readonly string[]
  ): void => {
    trackIds = trackIds.filter((track) => isTrackAvailable$$q(track));
    const trackIndex = shuffle.value
      ? Math.floor(Math.random() * trackIds.length)
      : 0;
    // NOTE: `setSetListAndPlay`に渡す`trackId`（第3引数）は`null`と`undefined`で挙動が異なる
    const track = trackIds[trackIndex] || null;
    setSetListAndPlay(name, trackIds, track);
  };

  /**
   * 現在再生中のトラックがないときに再生ボタンが押された際の処理 \
   * キューにトラックがある場合はそちらを、ない場合は（現在のビューの）デフォルトのセットリストを再生する
   */
  const playNext = (): void => {
    if (currentTrackId.value) {
      return;
    }

    if (trackProvider.queue$$q.length === 0) {
      // TrackProviderのsetListが空とは限らない（前へが使える場合がある）が、次へが無効であることには変わりない
      // 再生できるようにしたほうが利便性高いので再生する
      if (defaultSetList.value && defaultSetList.value.length > 0) {
        setSetListAndPlayAuto(defaultSetListName.value, defaultSetList.value);
      }
    } else {
      trackProvider.skipNext$$q();
    }
  };

  const removeTracks = (filter: (trackId: string) => boolean): void => {
    if (defaultSetList.value) {
      defaultSetList.value = defaultSetList.value.filter(filter);
    }

    trackProvider.removeTracks$$q(filter);
  };

  // watch for allTracks changes
  // - if tracks in setList are deleted, remove them from setList
  // - if the current track is deleted, play next
  //   - if no track is in setList, clear setList
  watch(serializedFilterKey$$q, (newKey): void => {
    if (!newKey) {
      return;
    }

    removeTracks(isTrackAvailable$$q);
  });

  {
    let trackChange = false;
    let sending = false;
    const sendTracks = (event: Event): void => {
      if (processingConnectedEvent || processingUpdatedEvent) {
        return;
      }

      if (event.type === 'trackChange') {
        trackChange = true;
      }

      if (sending) {
        return;
      }

      sending = true;
      Promise.resolve()
        .then((): void => {
          if (trackChange) {
            internalRemoteSeekingPosition.value = 0;
          }

          // skip sending 'setTracks' event because it is already sent by 'trackChange' event handler
          if (
            sessionType$$q.value !== 'host' ||
            !trackChange ||
            !trackProvider.currentTrack$$q
          ) {
            sendWS$$q(
              [
                {
                  type: 'setTracks',
                  tracks: {
                    ...trackProvider.export$$q(),
                    setListName: currentSetListName.value,
                  },
                  trackChange,
                },
              ],
              true
            );
          }
        })
        .finally((): void => {
          sending = false;
          trackChange = false;
        });
    };

    trackProvider.addEventListener('playNextQueueChange', sendTracks);
    trackProvider.addEventListener('queueChange', sendTracks);
    trackProvider.addEventListener('repeatChange', sendTracks);
    trackProvider.addEventListener('shuffleChange', sendTracks);
    trackProvider.addEventListener('trackChange', sendTracks);
  }

  const playTrack = (playing = true, position = 0): void => {
    const byRemote = processingConnectedEvent || processingUpdatedEvent;

    const trackId = trackProvider.currentTrack$$q;
    currentTrackId.value = trackId;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
    }

    if (currentAudio) {
      cleanupAudio(currentAudio);
      currentAudio.remove();
      currentAudio = undefined;
    }

    // load audio here because watching currentTrack does not trigger if the previous track is the same
    if (trackId) {
      const userId = getUserId();
      if (!userId) {
        console.error('playback: userId is not set');
        return;
      }

      const newAudio = createAudio();
      currentAudio = newAudio;

      audioContainer.appendChild(newAudio);
      internalSeekingPosition.value = undefined;
      internalPosition.value = 0;

      (async (): Promise<void> => {
        const track = await db.tracks.get(trackId);
        if (!track) {
          return;
        }

        const clampedPosition = Math.max(Math.min(position, track.duration), 0);

        const url = getBestTrackFileURL(
          userId,
          track,
          preferenceStore.audioQuality
        );

        if (needsCDNCookie(url)) {
          await setCDNCookie();
        }

        const metadataInit = await createMetadataInit(userId, track);

        if (currentAudio !== newAudio) {
          return;
        }

        if (
          sessionType$$q.value === 'host' ||
          (sessionType$$q.value === 'none' && !byRemote)
        ) {
          newAudio.preload = 'auto';
          newAudio.src = url;
          if (clampedPosition) {
            const canPlayPromise = new Promise((resolve, reject): void => {
              newAudio.addEventListener('canplay', resolve, {
                once: true,
              });
              newAudio.addEventListener('abort', reject, {
                once: true,
              });
              newAudio.addEventListener('error', reject, {
                once: true,
              });
            });
            await canPlayPromise;
            // TODO: clear event listeners
            newAudio.currentTime = clampedPosition;
          }
          if (playing) {
            await newAudio.play();
          }

          newAudio.classList.remove('preparing');

          sendWS$$q(
            [
              {
                type: 'setHost',
              },
              {
                type: 'setTracks',
                tracks: {
                  ...trackProvider.export$$q(),
                  setListName: currentSetListName.value,
                },
                trackChange: true,
              },
              {
                type: 'setState',
                duration: track.duration,
                position: clampedPosition,
                playing,
                timestamp: getAccurateTime(),
              },
            ],
            true
          );
        }

        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata(metadataInit);
          setMediaSessionActionHandlers();
        }
      })();
    } else {
      internalPlaying.value = false;
      internalPosition.value = undefined;
    }
  };

  // when host changed
  watch(sessionType$$q, (newSessionType): void => {
    if (newSessionType === 'host') {
      if (remotePlaybackState.value) {
        playTrack(
          remotePlaybackState.value.playing,
          calcPositionFromState(remotePlaybackState.value, getAccurateTime())
        );
      }
    } else if (currentAudio) {
      // we do not have to clear media session
      cleanupAudio(currentAudio);
      currentAudio.remove();
      currentAudio = undefined;
    }
  });

  trackProvider.addEventListener('trackChange', (): void => {
    playTrack();
  });

  trackProvider.addEventListener('playNextQueueChange', (): void => {
    playNextQueue.value = [...trackProvider.playNextQueue$$q];
  });

  trackProvider.addEventListener('queueChange', (): void => {
    queue.value = [...trackProvider.queue$$q];
  });

  trackProvider.addEventListener('repeatChange', (): void => {
    repeat.value = trackProvider.repeat$$q;
  });

  trackProvider.addEventListener('shuffleChange', (): void => {
    shuffle.value = trackProvider.shuffle$$q;
  });

  watch(
    computed(() => volumeStore.volume),
    (newVolume): void => {
      if (currentAudio) {
        currentAudio.volume = visualVolumeToRealVolume(newVolume);
      }
    },
    {
      immediate: true,
    }
  );

  watch(
    repeat,
    (newRepeat): void => {
      trackProvider.repeat$$q = newRepeat;
    },
    {
      immediate: true,
    }
  );

  watch(
    shuffle,
    (newShuffle): void => {
      trackProvider.shuffle$$q = newShuffle;
    },
    {
      immediate: true,
    }
  );

  //

  if ('mediaSession' in navigator) {
    watch(currentTrackId, (newTrack): void => {
      if (!newTrack) {
        clearMediaSession();
      }
    });
  }

  const cleanup = (): void => {
    currentAudio?.pause();
    currentAudio?.remove();
    currentAudio = undefined;

    if ('mediaSession' in navigator) {
      clearMediaSession();
    }
  };

  tryOnScopeDispose(() => {
    cleanup();
  });

  if (import.meta.hot) {
    import.meta.hot.accept((): void => {
      cleanup();
    });

    import.meta.hot.dispose((): void => {
      cleanup();
    });
  }

  const store = {
    /** シークバーの右側に残り時間を表示するか */
    showRemainingTime$$q: showRemainingTime,
    /** 再生中か */
    playing$$q: playing,
    /** 再生位置（秒） */
    position$$q: position,
    /** 再生時間（getterのみ） */
    duration$$q: computed(
      (): number | undefined => currentTrack.value.value?.duration
    ),
    /** 再生位置（0～1、getterのみ） */
    positionRate$$q: computed((): number | undefined =>
      currentTrack.value.value && internalPosition.value != null
        ? internalPosition.value / currentTrack.value.value.duration
        : undefined
    ),
    /** 規定のトラックリストが設定されているか */
    defaultSetListAvailable$$q: computed(
      (): boolean =>
        defaultSetList.value != null && defaultSetList.value.length > 0
    ),
    /**
     * 規定のトラックリストを設定する
     */
    setDefaultSetList$$q(name: string, trackIds: readonly string[]): void {
      defaultSetListName.value = name;
      defaultSetList.value = trackIds && [...trackIds];
    },
    clearDefaultSetList$$q(): void {
      defaultSetListName.value = '';
      defaultSetList.value = undefined;
    },
    /**
     * トラックリストを設定して再生する \
     * 同一のトラックが重複してはならない
     */
    setSetListAndPlay$$q: (
      name: string,
      trackIds: readonly string[],
      trackId: string,
      shuffleValue?: boolean
    ): void => {
      if (shuffleValue != null) {
        shuffle.value = shuffleValue;
      }
      if (repeat.value === 'one') {
        repeat.value = 'all';
      }
      setSetListAndPlay(name, trackIds, trackId);
    },
    /**
     * トラックリストを設定して再生する \
     * 再生するトラックは現在のシャッフルの設定によって自動で設定される \
     * （シャッフルが有効なら`tracks`の中からランダムで選択され、無効なら`tracks`の先頭の要素が選択される）
     */
    setSetListAndPlayAuto$$q: (
      name: string,
      trackIds: readonly string[],
      shuffleValue?: boolean
    ): void => {
      if (shuffleValue != null) {
        shuffle.value = shuffleValue;
      }
      if (repeat.value === 'one') {
        repeat.value = 'all';
      }
      setSetListAndPlayAuto(name, trackIds);
    },
    /** リピート再生 */
    repeat$$q: repeat,
    /** シャッフル再生 */
    shuffle$$q: shuffle,
    /** 現在のトラック */
    currentTrack$$q: currentTrackId,
    /** 現在のセットリスト名 */
    currentSetListName$$q: currentSetListName,
    /** 現在のセットリスト */
    currentSetList$$q: currentSetList,
    /** 再生キュー */
    queue$$q: queue,
    /** 次に再生のキュー */
    playNextQueue$$q: playNextQueue,
    appendTracksToPlayNextQueue$$q: (tracks: readonly string[]): void => {
      trackProvider.appendTracksToPlayNextQueue$$q(tracks);
    },
    removeTracksFromPlayNextQueue$$q: (index: number, count = 1): void => {
      trackProvider.removeTracksFromPlayNextQueue$$q(index, count);
    },
    /**
     * 次のトラックにスキップする \
     * リピートが one の場合は all に変更した上で次のトラックに進む
     */
    skipNext$$q: (n = 1): void => {
      trackProvider.skipNext$$q(n);
    },
    /** 前のトラックに戻る */
    skipPrevious$$q: (n = 1): void => {
      trackProvider.skipPrevious$$q(n);
    },
    /** 前のトラックに戻るか曲頭に戻る */
    goPrevious$$q: (): void => {
      goPrevious();
    },
    /**
     * 次のトラックに進む \
     * リピートが one のときは同じトラックを先頭から再生する
     */
    next$$q: (): void => {
      trackProvider.next$$q();
    },
  };

  return store as Readonly<typeof store>;
}

export const usePlaybackStore = createSharedComposable(_usePlaybackStore);
