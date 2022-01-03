import type { Ref } from 'vue';
import type { RepeatType } from '$shared/types/playback';
import defaultAlbumArt from '~/assets/default_album_art_256x256.png';
import { db } from '~/db';
import { getBestTrackFileURL } from '~/logic/audio';
import { needsCDNCookie, setCDNCookie } from '~/logic/cdnCookie';
import { getImageFileURL } from '~/logic/fileURL';
import { TrackProvider2 } from '~/logic/trackProvider2';
import {
  realVolumeToVisualVolume,
  visualVolumeToRealVolume,
} from '~/logic/volume';
import type { ResourceTrack } from '$/types';
import { useVolumeStore } from './volume';
import { useAllTracks } from '~/logic/useDB';

// TODO: このへんはユーザーの全クライアントで状態を共有できるようにする場合に定義とかを移すことになる

export interface PlaybackState {
  /** 再生中か */
  readonly playing$$q: Ref<boolean>;
  /** 再生位置（秒） */
  readonly position$$q: Ref<number | undefined>;
  /** 再生時間（getterのみ） */
  readonly duration$$q: Readonly<Ref<number | undefined>>;
  /** 再生位置（0～1、getterのみ） */
  readonly positionRate$$q: Readonly<Ref<number | undefined>>;
  readonly defaultSetListAvailable$$q: Readonly<Ref<boolean>>;
  /**
   * 規定のトラックリストを設定する
   */
  readonly setDefaultSetList$$q: (tracks?: readonly ResourceTrack[]) => void;
  /**
   * トラックリストを設定して再生する \
   * 同一のトラックが重複してはならない
   */
  readonly setSetListAndPlay$$q: (
    tracks: readonly ResourceTrack[],
    track: ResourceTrack
  ) => void;
  /**
   * トラックリストを設定して再生する \
   * 再生するトラックは現在のシャッフルの設定によって自動で設定される \
   * （シャッフルが有効なら`tracks`の中からランダムで選択され、無効なら`tracks`の先頭の要素が選択される）
   */
  readonly setSetListAndPlayAuto$$q: (tracks: readonly ResourceTrack[]) => void;
  /** リピート再生 */
  readonly repeat$$q: Ref<RepeatType>;
  /** シャッフル再生 */
  readonly shuffle$$q: Ref<boolean>;
  /** 現在のトラック */
  readonly currentTrack$$q: Readonly<Ref<ResourceTrack | undefined>>;
  /** 再生キュー */
  readonly queue$$q: Readonly<Ref<ResourceTrack[]>>;
  /** 次に再生のキュー */
  readonly playNextQueue$$q: Readonly<Ref<ResourceTrack[]>>;
  appendTracksToPlayNextQueue$$q: (tracks: readonly ResourceTrack[]) => void;
  removeTracksFromPlayNextQueue$$q: (index: number, count?: number) => void;
  /** 次のトラックにスキップする */
  readonly skipNext$$q: (n?: number) => void;
  /** 前のトラックに戻る */
  readonly skipPrevious$$q: (n?: number) => void;
  /** 次のトラックに進む */
  readonly next$$q: () => void;
  readonly debugRemoveTrack$$q: (trackId: string) => void;
}

const audioContainer = document.body;

async function createMetadataInit(
  track: ResourceTrack
): Promise<MediaMetadataInit> {
  const album = await db.albums.get(track.albumId);
  const artist = await db.artists.get(track.artistId);

  if (!album || !artist) {
    throw new Error('album or artist not found (db corrupted)');
  }

  const image =
    album.imageIds.length > 0
      ? await db.images.get(album.imageIds[0])
      : undefined;

  const artwork: MediaImage[] | undefined = image
    ? image.files.map((imageFile) => ({
        src: getImageFileURL(imageFile),
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

function _usePlaybackStore(): PlaybackState {
  const allTracks = useAllTracks();

  const volumeStore = useVolumeStore();

  let currentAudio: HTMLAudioElement | undefined;

  const trackProvider = new TrackProvider2<ResourceTrack>();

  const internalSeekingPosition = ref<number | undefined>();
  const internalPosition = ref<number | undefined>();
  const position = computed<number | undefined>({
    get: () => {
      return internalSeekingPosition.value ?? internalPosition.value;
    },
    set: (value: number | undefined) => {
      if (value == null || !currentAudio) {
        return;
      }
      internalSeekingPosition.value = value;
      currentAudio.currentTime = value;
    },
  });

  const repeat = ref<RepeatType>('off');
  const shuffle = ref<boolean>(false);
  const currentTrack = ref<ResourceTrack | undefined>();
  const queue = ref<ResourceTrack[]>([]);
  const playNextQueue = ref<ResourceTrack[]>([]);

  const defaultSetList = ref<ResourceTrack[] | undefined>();

  const internalPlaying = ref<boolean>(false);
  const playing = computed<boolean>({
    get: () => {
      return internalPlaying.value;
    },
    set: (value: boolean) => {
      if (value === internalPlaying.value) {
        return;
      }

      if (value && !currentTrack.value) {
        playNext();
        return;
      }

      internalPlaying.value = value;

      if (value) {
        currentAudio?.play();
      } else {
        currentAudio?.pause();
      }
    },
  });

  const createAudio = (): HTMLAudioElement => {
    const audio = new Audio();
    audio.classList.add('currentTrack');
    audio.volume = visualVolumeToRealVolume(volumeStore.volume);

    audio.onplay = () => {
      if (currentAudio !== audio) {
        return;
      }

      internalPlaying.value = true;
    };

    audio.onpause = () => {
      if (currentAudio !== audio) {
        return;
      }

      internalPlaying.value = false;
    };

    audio.onseeked = () => {
      if (currentAudio !== audio) {
        return;
      }

      internalSeekingPosition.value = undefined;
      internalPosition.value = audio.currentTime;
    };

    audio.ontimeupdate = () => {
      if (currentAudio !== audio || audio.seeking) {
        return;
      }

      internalPosition.value = audio.currentTime;

      if ('mediaSession' in navigator) {
        if (
          audio.readyState !== audio.HAVE_NOTHING &&
          isFinite(audio.duration) &&
          isFinite(audio.playbackRate) &&
          isFinite(audio.currentTime) &&
          audio.duration > 0
        ) {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime,
          });
          console.log('mediaSession updated E');
        }
      }
    };

    audio.onended = () => {
      if (currentAudio !== audio) {
        return;
      }

      trackProvider.next$$q();
    };

    audio.onvolumechange = () => {
      if (currentAudio !== audio) {
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

  const cleanupAudio = (audio: HTMLAudioElement) => {
    audio.onplay = null;
    audio.onpause = null;
    audio.onseeked = null;
    audio.ontimeupdate = null;
    audio.onended = null;
    audio.onvolumechange = null;
  };

  const setSetListAndPlay = (
    tracks: readonly ResourceTrack[],
    track?: ResourceTrack | null
  ): void => {
    playing.value = false;
    // NOTE: `setSetList$$q`に渡す`currentTrack`（第2引数）は`null`と`undefined`で挙動が異なる
    trackProvider.setSetList$$q(tracks, tracks.length ? track : null);
    if (tracks.length) {
      internalPosition.value = 0;
      playing.value = true;
    } else {
      internalPosition.value = undefined;
    }
  };

  const setSetListAndPlayAuto = (tracks: readonly ResourceTrack[]): void => {
    const trackIndex = shuffle.value
      ? Math.floor(Math.random() * tracks.length)
      : 0;
    // NOTE: `setSetListAndPlay`に渡す`track`（第2引数）は`null`と`undefined`で挙動が異なる
    const track = tracks[trackIndex] || null;
    setSetListAndPlay(tracks, track);
  };

  /**
   * 現在再生中のトラックがないときに再生ボタンが押された際の処理 \
   * キューにトラックがある場合はそちらを、ない場合は（現在のビューの）デフォルトのセットリストを再生する
   */
  const playNext = (): void => {
    if (currentTrack.value) {
      return;
    }

    if (trackProvider.queue$$q.length === 0) {
      // TrackProviderのsetListが空とは限らない（前へが使える場合がある）が、次へが無効であることには変わりない
      // 再生できるようにしたほうが利便性高いので再生する
      if (defaultSetList.value && defaultSetList.value.length > 0) {
        setSetListAndPlayAuto(defaultSetList.value);
      }
    } else {
      trackProvider.skipNext$$q();
    }
  };

  const removeTracks = (trackIds: readonly string[]): void => {
    if (defaultSetList.value) {
      const trackIdSet = new Set(trackIds);
      defaultSetList.value = defaultSetList.value.filter(
        (track) => !trackIdSet.has(track.id)
      );
    }

    trackProvider.removeTracks$$q(trackIds);
  };

  // watch for allTracks changes
  // - if tracks in setList are deleted, remove them from setList
  // - if the current track is deleted, play next
  //   - if no track is in setList, clear setList
  watch(allTracks.value, (newAllTracks, oldAllTracks): void => {
    if (!newAllTracks || !oldAllTracks) {
      return;
    }

    const newAllTrackIdSet = new Set(newAllTracks.map((track) => track.id));
    const deletedTrackIdSet = new Set(
      oldAllTracks
        .map((track) => track.id)
        .filter((trackId) => !newAllTrackIdSet.has(trackId))
    );
    const deletedTrackIds = Array.from(deletedTrackIdSet);

    if (deletedTrackIds.length === 0) {
      return;
    }

    removeTracks(deletedTrackIds);
  });

  trackProvider.addEventListener('trackChange', () => {
    const track = trackProvider.currentTrack$$q;
    currentTrack.value = track;

    if (currentAudio) {
      cleanupAudio(currentAudio);
      currentAudio.pause();
      currentAudio.remove();
      currentAudio = undefined;
    }

    // load audio here because watching currentTrack does not trigger if the previous track is the same
    if (track) {
      const newAudio = createAudio();
      currentAudio = newAudio;

      audioContainer.appendChild(newAudio);
      internalSeekingPosition.value = undefined;
      internalPosition.value = 0;

      (async (): Promise<void> => {
        const url = getBestTrackFileURL(track.files);

        if (needsCDNCookie(url)) {
          await setCDNCookie();
        }

        const metadataInit = await createMetadataInit(track);

        if (currentAudio !== newAudio) {
          return;
        }

        newAudio.src = url;
        newAudio.currentTime = 0;
        await newAudio.play();

        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata(metadataInit);
          navigator.mediaSession.setPositionState({
            duration: track.duration,
            playbackRate: 1,
            position: 0,
          });
          navigator.mediaSession.playbackState = 'playing';
          console.log('mediaSession updated A', navigator.mediaSession);
        }
      })();
    } else {
      internalPlaying.value = false;
      internalPosition.value = undefined;
    }
  });

  trackProvider.addEventListener('playNextQueueChange', () => {
    playNextQueue.value = [...trackProvider.playNextQueue$$q];
  });

  trackProvider.addEventListener('queueChange', () => {
    queue.value = [...trackProvider.queue$$q];
  });

  trackProvider.addEventListener('repeatChange', () => {
    repeat.value = trackProvider.repeat$$q;
  });

  trackProvider.addEventListener('shuffleChange', () => {
    shuffle.value = trackProvider.shuffle$$q;
  });

  watch(
    computed(() => volumeStore.volume),
    (newVolume) => {
      if (currentAudio) {
        currentAudio.volume = visualVolumeToRealVolume(newVolume);
      }
    }
  );

  watch(repeat, (newRepeat) => {
    trackProvider.repeat$$q = newRepeat;
  });

  watch(shuffle, (newShuffle) => {
    trackProvider.shuffle$$q = newShuffle;
  });

  //

  if ('mediaSession' in navigator) {
    watch(currentTrack, (newTrack) => {
      if (!newTrack) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
        console.log('mediaSession updated B');
      }
    });

    watch(playing, (newPlaying) => {
      console.log('mediaSession updated C');
      navigator.mediaSession.playbackState = newPlaying ? 'playing' : 'paused';
    });

    navigator.mediaSession.setActionHandler('play', () => {
      playing.value = true;
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      playing.value = false;
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      playing.value = false;
      position.value = 0;
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      trackProvider.skipPrevious$$q();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      trackProvider.skipNext$$q();
    });

    try {
      navigator.mediaSession.setActionHandler('seekto', function (event) {
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
        console.log('mediaSession updated D');
      });
    } catch (error) {
      console.warn(
        'Warning! The "seekto" media session action is not supported.'
      );
    }
  }

  if (import.meta.hot) {
    const cleanup = () => {
      currentAudio?.pause();
      currentAudio?.remove();
      currentAudio = undefined;

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
    };

    import.meta.hot.accept(() => {
      cleanup();
    });

    import.meta.hot.dispose(() => {
      cleanup();
    });
  }

  return {
    playing$$q: playing,
    position$$q: position,
    duration$$q: computed((): number | undefined => {
      return currentTrack.value?.duration;
    }),
    positionRate$$q: computed((): number | undefined => {
      return currentTrack.value && internalPosition.value != null
        ? internalPosition.value / currentTrack.value.duration
        : undefined;
    }),
    defaultSetListAvailable$$q: computed((): boolean => {
      return defaultSetList.value != null && defaultSetList.value.length > 0;
    }),
    setDefaultSetList$$q(tracks?: readonly ResourceTrack[]): void {
      defaultSetList.value = tracks && [...tracks];
    },
    setSetListAndPlay$$q: (
      tracks: readonly ResourceTrack[],
      track: ResourceTrack
    ): void => {
      setSetListAndPlay(tracks, track);
    },
    setSetListAndPlayAuto$$q: (tracks: readonly ResourceTrack[]): void => {
      setSetListAndPlayAuto(tracks);
    },
    repeat$$q: repeat,
    shuffle$$q: shuffle,
    currentTrack$$q: currentTrack,
    queue$$q: queue,
    playNextQueue$$q: playNextQueue,
    appendTracksToPlayNextQueue$$q: (
      tracks: readonly ResourceTrack[]
    ): void => {
      trackProvider.appendTracksToPlayNextQueue$$q(tracks);
    },
    removeTracksFromPlayNextQueue$$q: (index: number, count = 1): void => {
      trackProvider.removeTracksFromPlayNextQueue$$q(index, count);
    },
    skipNext$$q: (n = 1): void => {
      trackProvider.skipNext$$q(n);
    },
    skipPrevious$$q: (n = 1): void => {
      trackProvider.skipPrevious$$q(n);
    },
    next$$q: (): void => {
      trackProvider.next$$q();
    },
    debugRemoveTrack$$q: (trackId: string): void => {
      removeTracks([trackId]);
    },
  };
}

let gState: PlaybackState | undefined;

export function usePlaybackStore(): PlaybackState {
  if (!gState) {
    console.log('create playback store');
    gState = _usePlaybackStore();
  }
  return gState;
}
