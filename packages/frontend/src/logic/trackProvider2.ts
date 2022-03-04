import { MAX_HISTORY_SIZE } from '$shared/config';
import type { TrackId, TrackProvider2State } from '$shared/types';
import { TrackProvider } from './trackProvider';

/**
 * `TrackProvider`に次に再生キューを追加したもの \
 * `TrackProvider`自体が複雑で完成度が高いため
 */
export class TrackProvider2 extends TrackProvider {
  private _playNextQueue$$q: TrackId[] = [];
  private _playNextHistory$$q: TrackId[] = [];
  private _currentTrackOverride$$q: TrackId | undefined;

  get currentTrack$$q(): TrackId | undefined {
    return this._currentTrackOverride$$q || super.currentTrack$$q;
  }

  get playNextQueue$$q(): readonly TrackId[] {
    return this._playNextQueue$$q;
  }

  /**
   * `'playNextQueueChange'`イベントを発火する \
   * 必ずしも本当に変更がされているとは限らない
   */
  private emitPlayNextQueueChangeEvent$$q(): void {
    this.dispatchEvent(new Event('playNextQueueChange'));
  }

  appendTracksToPlayNextQueue$$q(tracks: readonly TrackId[]): void {
    this._playNextQueue$$q.push(...tracks);
    this.emitPlayNextQueueChangeEvent$$q();
  }

  removeTracksFromPlayNextQueue$$q(index: number, count = 1): void {
    if (count < 1) {
      return;
    }
    this._playNextQueue$$q.splice(index, count);
    this.emitPlayNextQueueChangeEvent$$q();
  }

  override setSetList$$q(
    setList: readonly TrackId[],
    currentTrack?: TrackId | null
  ): void {
    if (currentTrack !== undefined && this._currentTrackOverride$$q) {
      this._playNextHistory$$q = [];
      this._currentTrackOverride$$q = undefined;
    }

    super.setSetList$$q(setList, currentTrack);
  }

  override skipNext$$q(n = 1): void {
    // nを正規化し、値を検証する
    n = Math.round(n);

    // 値が不正な場合は何もしない
    // `n !== 0`の場合は例外を投げても良いが
    if (!isFinite(n) || n < 1) {
      return;
    }

    // リピートの設定が「1曲のみ」の場合は、リピートの設定を「全て」に変更した上で実行する
    if (super.repeat$$q === 'one') {
      // ここではちゃんとsetterを呼び出す必要がある
      super.repeat$$q = 'all';
      // 変更を通知
      super.emitRepeatChangeEvent$$q();
      this.skipNext$$q(n);
      return;
    }

    // 指定された回数だけスキップ処理を行う
    while (n > 0) {
      // トラックを履歴に追加
      if (this._currentTrackOverride$$q) {
        this._playNextHistory$$q.push(this._currentTrackOverride$$q);
        this._playNextHistory$$q.splice(
          0,
          this._playNextHistory$$q.length - MAX_HISTORY_SIZE
        );
      }

      // キューからトラックを1つ取り出す
      const track = this._playNextQueue$$q.shift();
      this._currentTrackOverride$$q = track;
      if (!track) {
        // キューにトラックがなかったため、取り出せなかった
        // 基底クラスに取り出せなかった分を取り出してもらうため、nは減らさない
        break;
      }

      n--;
    }

    // トラックがなくなったら基底クラスに残りの処理を委譲する
    if (n > 0) {
      // 履歴については
      // - 次に再生キューが空でない場合：次に再生キューの履歴→通常の履歴
      // - 次に再生キューが空である場合：通常の履歴→次に再生キューの履歴（ただし次に再生キューが一度しか操作されていない場合）
      // としなければならず、後者はまあまあ面倒である（特に二度以上に渡って次に再生キューが操作された場合は完全な履歴を保持しなければ復元できいない）
      // よって、次に再生キューが空になった時点で履歴を破棄してしまうことにする
      this._playNextHistory$$q = [];
      super.skipNext$$q(n);
    } else {
      super.emitTrackChangeEvent$$q();
    }
    this.emitPlayNextQueueChangeEvent$$q();
  }

  override skipPrevious$$q(n = 1): void {
    // nを正規化し、値を検証する
    n = Math.round(n);

    // 値が不正な場合は何もしない
    // `n !== 0`の場合は例外を投げても良いが
    if (!isFinite(n) || n < 1) {
      return;
    }

    // リピートの設定が「1曲のみ」の場合は、リピートの設定を「全て」に変更した上で実行する
    if (super.repeat$$q === 'one') {
      // ここではちゃんとsetterを呼び出す必要がある
      super.repeat$$q = 'all';
      // 変更を通知
      super.emitRepeatChangeEvent$$q();
      this.skipPrevious$$q(n);
      return;
    }

    // 指定された回数だけスキップ処理を行う
    while (n > 0) {
      // トラックをキューに追加
      if (this._currentTrackOverride$$q) {
        this._playNextQueue$$q.unshift(this._currentTrackOverride$$q);
      }

      // 履歴からトラックを1つ取り出す
      const track = this._playNextHistory$$q.pop();
      this._currentTrackOverride$$q = track;
      if (!track) {
        // 履歴にトラックがなかったため、取り出せなかった
        // 基底クラスに取り出せなかった分を取り出してもらうため、nは減らさない
        break;
      }

      n--;
    }

    // トラックがなくなったら基底クラスに残りの処理を委譲する
    if (n > 0) {
      super.skipPrevious$$q(n);
    } else {
      super.emitTrackChangeEvent$$q();
    }
    this.emitPlayNextQueueChangeEvent$$q();
  }

  override removeTracks$$q(filter: (trackId: string) => boolean): void {
    super.removeTracks$$q(filter);

    this._playNextQueue$$q = this._playNextQueue$$q.filter(filter);
    this._playNextHistory$$q = this._playNextHistory$$q.filter(filter);
    if (
      this._currentTrackOverride$$q &&
      !filter(this._currentTrackOverride$$q)
    ) {
      this.skipNext$$q();
    } else {
      this.emitPlayNextQueueChangeEvent$$q();
    }
  }

  export$$q(): TrackProvider2State {
    return {
      ...super.export$$q(),
      currentTrackOverride: this._currentTrackOverride$$q ?? null,
      playNextQueue: this._playNextQueue$$q,
      playNextHistory: this._playNextHistory$$q,
    };
  }

  import$$q(state: TrackProvider2State, emitTrackChange = true): void {
    this._currentTrackOverride$$q = state.currentTrackOverride ?? undefined;
    this._playNextQueue$$q = [...state.playNextQueue];
    this._playNextHistory$$q = [...state.playNextHistory];
    super.import$$q(state, emitTrackChange);
    this.emitPlayNextQueueChangeEvent$$q();
  }
}

// `TrackProvider2`の`addEventListener`メソッドのオーバーロードの定義
// class内には実装を記述しない限り記述できない
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface TrackProvider2 {
  addEventListener(
    type: 'trackChange' | 'queueChange' | 'repeatChange' | 'shuffleChange',
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void;

  /**
   * `playNextQueue$$q`が変更された際のイベント
   */
  addEventListener(
    type: 'playNextQueueChange',
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void;
}
