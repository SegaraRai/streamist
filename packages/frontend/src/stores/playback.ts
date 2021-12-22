import { Ref, UnwrapRef } from 'vue';
import type { RepeatType } from '$shared/types/playback';
import defaultAlbumArt from '~/assets/default_album_art_256x256.png';
import { db } from '~/db';
import { getBestTrackFileURL } from '~/logic/audio';
import { needsCDNCookie, setCDNCookie } from '~/logic/cdnCookie';
import { getImageFileURL } from '~/logic/fileURL';
import { TrackProvider } from '~/logic/trackProvider';
import type { ResourceTrack } from '$/types';
import { useVolumeStore } from './volume';

// TODO: このへんはユーザーの全クライアントで状態を共有できるようにする場合に定義とかを移すことになる

type RefOrValue<T> = T | Ref<T>;

export interface PlaybackState {
  /** 再生中か */
  playing$$q: RefOrValue<boolean>;
  /** 再生位置（秒） */
  position$$q: RefOrValue<number | undefined>;
  /** 再生時間（getterのみ） */
  readonly duration$$q: RefOrValue<number | undefined>;
  /** 再生位置（0～1、getterのみ） */
  readonly positionRate$$q: RefOrValue<number | undefined>;
  readonly defaultSetListAvailable$$q: RefOrValue<boolean>;
  /**
   * 規定のトラックリストを設定する
   */
  setDefaultSetList$$q(tracks?: readonly ResourceTrack[]): void;
  /**
   * トラックリストを設定して再生する \
   * 同一のトラックが重複してはならない
   */
  setSetListAndPlay$$q(
    tracks: readonly ResourceTrack[],
    track: ResourceTrack
  ): void;
  /**
   * トラックリストを設定して再生する \
   * 再生するトラックは現在のシャッフルの設定によって自動で設定される \
   * （シャッフルが有効なら`tracks`の中からランダムで選択され、無効なら`tracks`の先頭の要素が選択される）
   */
  setSetListAndPlayAuto$$q(tracks: readonly ResourceTrack[]): void;
  /** リピート再生 */
  repeat$$q: RefOrValue<RepeatType>;
  /** シャッフル再生 */
  shuffle$$q: RefOrValue<boolean>;
  /** 現在のトラック */
  readonly currentTrack$$q: RefOrValue<ResourceTrack | undefined>;
  /** 再生キュー、先頭の要素が再生中のもの */
  readonly queue$$q: RefOrValue<ResourceTrack[]>;
  /** 次のトラックにスキップする */
  skipNext$$q(n?: number): void;
  /** 前のトラックに戻る */
  skipPrevious$$q(n?: number): void;
  /** 次のトラックに進む */
  next$$q(): void;
}

declare type Refs<Data> = {
  [K in keyof Data]: Data[K] extends Ref<infer V> ? Ref<V> : Ref<Data[K]>;
};

let state: UnwrapRef<PlaybackState>;
let refState: Refs<typeof state>;

/*
async function loadRemote() {
  if (!state) {
    return;
  }

  // TODO:
}
//*/

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

export function usePlaybackStore(): typeof refState {
  if (!state) {
    const volumeStore = useVolumeStore();

    let audio: HTMLAudioElement | undefined;

    const trackProvider = new TrackProvider<ResourceTrack>();

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
          audio?.play();
        } else {
          audio?.pause();
        }
      },
    });

    const internalSeekingPosition = ref<number | undefined>();
    const internalPosition = ref<number | undefined>();
    const position = computed<number | undefined>({
      get: () => {
        return internalSeekingPosition.value ?? internalPosition.value;
      },
      set: (value: number | undefined) => {
        if (value == null || !audio) {
          return;
        }
        internalSeekingPosition.value = value;
        audio.currentTime = value;
      },
    });
    const repeat = ref<RepeatType>('off');
    const shuffle = ref<boolean>(false);
    const currentTrack = ref<ResourceTrack | undefined>();
    const queue = ref<ResourceTrack[]>([]);
    const defaultSetList = ref<ResourceTrack[] | undefined>();

    const createAudio = (): HTMLAudioElement => {
      const audio = new Audio();
      audio.classList.add('currentTrack');
      audio.volume = volumeStore.volume / 100;

      audio.addEventListener('play', () => {
        internalPlaying.value = true;
      });

      audio.addEventListener('pause', () => {
        internalPlaying.value = false;
      });

      audio.addEventListener('seeked', () => {
        internalSeekingPosition.value = undefined;
        internalPosition.value = audio.currentTime;
      });

      audio.addEventListener('timeupdate', () => {
        if (audio.seeking) {
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
      });

      audio.addEventListener('ended', () => {
        trackProvider.next$$q();
      });

      audio.addEventListener('volumechange', () => {
        if (volumeStore.volume === Math.round(audio.volume * 100)) {
          // this is needed to suppress update of unmutedVolume
          return;
        }
        volumeStore.volume = audio.volume * 100;
      });

      return audio;
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

    trackProvider.addEventListener('trackChange', () => {
      const track = trackProvider.currentTrack$$q;
      currentTrack.value = track;

      audio?.pause();
      audio?.remove();
      audio = undefined;

      // load audio here because watching currentTrack does not trigger if the previous track is the same
      if (track) {
        const newAudio = createAudio();
        audio = newAudio;

        audioContainer.appendChild(newAudio);
        internalSeekingPosition.value = undefined;
        internalPosition.value = 0;

        (async () => {
          const url = getBestTrackFileURL(track.files);

          if (needsCDNCookie(url)) {
            await setCDNCookie();
          }

          const metadataInit = await createMetadataInit(track);

          audio.src = url;
          audio.currentTime = 0;
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
        if (audio) {
          audio.volume = newVolume / 100;
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
        navigator.mediaSession.playbackState = newPlaying
          ? 'playing'
          : 'paused';
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
          if (!audio || seekTime == null) {
            return;
          }
          if (event.fastSeek && 'fastSeek' in audio) {
            audio.fastSeek(seekTime);
            return;
          }
          internalSeekingPosition.value = seekTime;
          audio.currentTime = seekTime;
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
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

    //

    state = reactive<PlaybackState>({
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
      setDefaultSetList$$q(tracks?: readonly ResourceTrack[]) {
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
      skipNext$$q: (n = 1) => {
        trackProvider.skipNext$$q(n);
      },
      skipPrevious$$q: (n = 1) => {
        trackProvider.skipPrevious$$q(n);
      },
      next$$q: () => {
        trackProvider.next$$q();
      },
    });

    refState = toRefs(state);

    if (import.meta.hot) {
      const cleanup = () => {
        audio?.pause();
        audio?.remove();
        audio = undefined;

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
  }

  return refState;
}
