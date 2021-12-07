import { Ref, UnwrapRef, computed, reactive, ref, toRefs, watch } from 'vue';
import type { RepeatType } from '$shared/types/playback';
import { TrackProvider } from '@/logic/trackProvider';
import type { TrackForPlayback } from '@/types/playback';

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
  /**
   * ユーザーが再生位置を更新しようとしているか \
   * 普通に再生しているだけでもpositionは更新されるため、positionを監視してシークを行う場合、
   * ユーザーによってpositionが更新されたのかを確認する必要がある \
   * そのためのフラグ
   */
  seeking$$q: RefOrValue<boolean>;
  /**
   * トラックリストを設定して再生する \
   * 同一のトラックが重複してはならない
   */
  setSetListAndPlay$$q(
    tracks: TrackForPlayback[],
    track: TrackForPlayback
  ): void;
  /**
   * トラックリストを設定して再生する \
   * 再生するトラックは現在のシャッフルの設定によって自動で設定される \
   * （シャッフルが有効なら`tracks`の中からランダムで選択され、無効なら`tracks`の先頭の要素が選択される）
   */
  setSetListAndPlayAuto$$q(tracks: TrackForPlayback[]): void;
  /** リピート再生 */
  repeat$$q: RefOrValue<RepeatType>;
  /** シャッフル再生 */
  shuffle$$q: RefOrValue<boolean>;
  /** 現在のトラック */
  readonly currentTrack$$q: RefOrValue<TrackForPlayback | undefined>;
  /** 再生キュー、先頭の要素が再生中のもの */
  readonly queue$$q: RefOrValue<TrackForPlayback[]>;
  /** 次のトラックにスキップする */
  skipNext$$q(n?: number): void;
  /** 前のトラックに戻る */
  skipPrevious$$q(n?: number): void;
  /** 次のトラックに進む */
  next$$q(): void;
}

const gTrackProvider = new TrackProvider();

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

export function usePlaybackStore(): typeof refState {
  if (!state) {
    const playing = ref<boolean>(false);
    const position = ref<number | undefined>();
    const seeking = ref<boolean>(false);
    const repeat = ref<RepeatType>('off');
    const shuffle = ref<boolean>(false);
    const currentTrack = ref<TrackForPlayback | undefined>();
    const queue = ref<TrackForPlayback[]>([]);

    gTrackProvider.addEventListener('trackChange', () => {
      currentTrack.value = gTrackProvider.currentTrack$$q;
    });

    gTrackProvider.addEventListener('queueChange', () => {
      queue.value = [...gTrackProvider.queue$$q];
    });

    gTrackProvider.addEventListener('repeatChange', () => {
      repeat.value = gTrackProvider.repeat$$q;
    });

    gTrackProvider.addEventListener('shuffleChange', () => {
      shuffle.value = gTrackProvider.shuffle$$q;
    });

    watch(repeat, (newRepeat) => {
      gTrackProvider.repeat$$q = newRepeat;
    });

    watch(shuffle, (newShuffle) => {
      gTrackProvider.shuffle$$q = newShuffle;
    });

    watch(currentTrack, (newCurrentTrack) => {
      if (!newCurrentTrack) {
        playing.value = false;
        position.value = undefined;
      }
    });

    const setSetListAndPlay = (
      tracks: TrackForPlayback[],
      track?: TrackForPlayback | null
    ): void => {
      playing.value = false;
      // NOTE: `setSetList$$q`に渡す`currentTrack`（第2引数）は`null`と`undefined`で挙動が異なる
      gTrackProvider.setSetList$$q(tracks, tracks.length ? track : null);
      if (tracks.length) {
        position.value = 0;
        playing.value = true;
      } else {
        position.value = undefined;
      }
    };

    state = reactive<PlaybackState>({
      playing$$q: playing,
      position$$q: position,
      duration$$q: computed((): number | undefined => {
        return currentTrack.value?.duration;
      }),
      positionRate$$q: computed((): number | undefined => {
        return currentTrack.value && position.value != null
          ? position.value / currentTrack.value.duration
          : undefined;
      }),
      seeking$$q: seeking,
      setSetListAndPlay$$q: (
        tracks: TrackForPlayback[],
        track: TrackForPlayback
      ): void => {
        setSetListAndPlay(tracks, track);
      },
      setSetListAndPlayAuto$$q: (tracks: TrackForPlayback[]): void => {
        const trackIndex = shuffle.value
          ? Math.floor(Math.random() * tracks.length)
          : 0;
        // NOTE: `setSetListAndPlay`に渡す`track`（第2引数）は`null`と`undefined`で挙動が異なる
        const track = tracks[trackIndex] || null;
        setSetListAndPlay(tracks, track);
      },
      repeat$$q: repeat,
      shuffle$$q: shuffle,
      currentTrack$$q: currentTrack,
      queue$$q: queue,
      skipNext$$q: (n = 1) => {
        gTrackProvider.skipNext$$q(n);
      },
      skipPrevious$$q: (n = 1) => {
        gTrackProvider.skipPrevious$$q(n);
      },
      next$$q: () => {
        gTrackProvider.next$$q();
      },
    });

    refState = toRefs(state);
  }

  return refState;
}
