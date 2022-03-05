import { MAX_HISTORY_SIZE, MIN_QUEUE_SIZE } from '$shared/config';
import { shuffleArray } from '$shared/shuffle';
import type { RepeatType, TrackId, TrackProviderState } from '$shared/types';
import { toUnique } from '$shared/unique';

/*
## 用語定義

- セットリスト
  再生予定のトラックが再生順に並んだリスト
  基本的に画面に表示されている全てのトラックを表示順に並べたもの
  例えばアルバム画面で再生を開始した場合はそのアルバムのトラックになり、
  プレイリスト画面で再生を開始した場合はプレイリストのトラックになる
  このセットリストはシャッフルやリピートの影響を受けない
- （再生）キュー
  実際に再生予定のトラックのリスト
  リピートやシャッフルの設定によって変わる
- リピートについて
  有効であるとは「1曲のみ」（single）または「全て」（multiple）である状態を指す

## 要求仕様

- リピートを1曲のみに指定した場合、キューには影響を与えない
- リピートを切り替えると、その時点で再生キューに変更が加わる
  - リピートを無効にしたとき、かつシャッフルが無効になっている場合は再生キューにはセットリスト上の現在のトラック以降のものだけになるようにする
  - リピートを「1曲のみ」にした場合、再生キューに影響を与えるかどうかは未定
- シャッフルを切り替えると、その時点で再生キューに変更が加わる
  - シャッフルを無効にしたとき、かつリピートが無効になっている場合は再生キューにはセットリスト上の現在のトラック以降のものだけになるようにする
  - シャッフルを有効にしたときは、リピートの設定に関わらず再生中のトラック（存在する場合）を除いたセットリストの全要素からキューを構成する
    - リピートが「1曲のみ」の場合にどうするかは未定
  - シャッフルを無効にして再度有効にしたときキューの並び順は同じにならなくて良い
- なるべく前のトラックに戻るができるようにする
- 「次に再生」と「後で再生」の機能を設ける
  - 「次に再生」はキューの先頭にトラックを追加する
  - 「後で再生」はキューの末尾にトラックを追加する
    - リピートが有効になっている場合、この機能を使用できなくする
      どうしてもならリピートを無効にした上でトラックを追加する
- 「次のトラックに進む」と「前のトラックに戻る」は、リピートが有効な場合は常に実行できるようにする
  - リピートの設定が「1曲のみ」の場合は、リピートの設定を「全て」に変更した上で実行する
  - 履歴がない状態で「前のトラックに戻る」が実行されたときは履歴を生成する
    このとき、シャッフルとリピートの設定を考慮して生成する必要がある

## 実装

- [UI]キューに何もない状態（必然的にリピートは無効の状態）では「次のトラックに進む」は
  - 現在のトラックがundefinedでない場合は、現在のトラックをundefinedにする
  - 現在のトラックがundefinedの場合は、押せないようにする
- [UI]履歴に何もない状態（必然的にリピートは無効の状態）では「次のトラックに進む」は

- キューを通常のキューとリピート用のキューに分ける
  表示時は連結して表示する
- セットリストが空の場合はリピートやシャッフルを設定できないようにする
- セットリストが空の場合にキューを再生成する処理が走ったらリピート用のキューの中身を空にするだけとする
- リピートが「1曲のみ」に切り替えられたときは何もしない
- リピートが有効になったときは、リピート用のキューを生成する
  リピートが無効になったときは、リピート用のキューを空にする
- シャッフルが有効になったときは、通常のキューと必要ならばリピート用のキューを再生成する
  シャッフルが無効になったときは、通常のキューと必要ならばリピート用のキューを再生成する
- リピートやシャッフルが操作されず次のトラックに移っただけのとき
  - リピートが有効な場合かつ通常のキューの要素数が0になったときは、
    リピート用のキューからセットリストの要素数分をキューに移動し、リピート用のキューを補充する
*/

/**
 * トラックリストの管理を行うクラス \
 * 与えられたセットリストと、リピートやシャッフルの設定から、再生すべきトラックを提供する \
 * スキップや前の曲に戻るといった操作も提供する
 */
export class TrackProvider extends EventTarget {
  /**
   * 現在のリピートの設定 \
   * 内部用 \
   * 外部からは`repeat$$q`のgetterやsetterを用いる
   */
  private _repeat$$q: RepeatType = 'off';

  /**
   * 現在のシャッフルの設定 \
   * 内部用 \
   * 外部からは`shuffle$$q`のgetterやsetterを用いる
   */
  private _shuffle$$q = false;

  /**
   * 現在のトラック
   *
   * 現在のトラックが存在しない場合は`undefined`になる。具体的には以下の場合
   * - 初期状態
   * - リピートが無効で、履歴の最初において「前のトラックに戻る」を行った後
   * - リピートが無効で、キューの最後において「次のトラックに進む」を行った後
   *
   * 現在再生中か一時停止しているかは関係ない（そもそも`TrackProvider`では関知しない） \
   * オブジェクトは必ず`_setList$$q`の要素の1つ（同一の参照）である \
   * 内部用、外部からは`currentTrack$$q`のgetterを用いる
   */
  private _currentTrack$$q: TrackId | undefined;

  /**
   * 再生キュー \
   * 各要素は必ず`_setList$$q`の要素の1つ（同一の参照）である \
   * 内部用 \
   * 外部からは`queue$$q`のgetterを用いる（ただしそれで取得されるのは実際には`_queueCache$$q`） \
   * `_queue$$q`に`_repeatQueue$$q`を結合したものが`_queueCache$$q`になる \
   * リピートを勘案しない、セットリストの残りトラックのみで構成される
   * （シャッフル有効時はセットリストから現在のトラックのみを除いてシャッフルしたもので、シャッフル無効時はセットリストから現在のトラック以前を除いたもの） \
   */
  private _queue$$q: TrackId[] = [];

  /**
   * リピート用の再生キュー \
   * リピートが有効なときのみ要素を入れる \
   * `_queue$$q`に`_repeatQueue$$q`を結合したものが`_queueCache$$q`になる \
   * 要素数は`_setList$$q`の要素数の倍数でかつ`MIN_QUEUE_SIZE`以上になるようにする \
   * 各要素は必ず`_setList$$q`の要素の1つ（同一の参照）である \
   * 内部用
   */
  private _repeatQueue$$q: TrackId[] = [];

  /**
   * リピートやシャッフルを構成するトラックのリスト（セットリストと呼ぶ） \
   * 設定時は（IDが）同一のトラックが重複しないようにすること \
   * 内部用
   */
  private _setList$$q: TrackId[] = [];

  /**
   * 「前のトラックに戻る」機能用の再生履歴スタック \
   * 後ろにあるものほど新しい \
   * 各要素は必ず`_setList$$q`の要素の1つ（同一の参照）である \
   * 内部用
   */
  private _history$$q: TrackId[] = [];

  /**
   * 対外的に見せるためのキュー配列 \
   * 各要素は必ず`_setList$$q`の要素の1つ（同一の参照）である \
   * 内部用 \
   * 外部からは`queue$$q`のgetterを用いる
   * こちらはリピートの設定に応じてトラックが補充されているものになる（すなわち、`[..._queue$$q, ..._repeatQueue$$q]`） \
   * リピートが無効な場合は`_queue$$q`と同じ内容
   */
  private _queueCache$$q: TrackId[] = [];

  /**
   * `'queueChange'`イベントを発火する \
   * 必ずしも本当に変更がされているとは限らない
   */
  private emitQueueChangeEvent$$q(): void {
    // 破壊的に内容を入れ替える
    this._queueCache$$q.splice(
      0,
      this._queueCache$$q.length,
      ...this._queue$$q,
      ...this._repeatQueue$$q
    );

    this.dispatchEvent(new Event('queueChange'));
  }

  /**
   * `'trackChange'`イベントを発火する \
   * 必ずしも本当に変更がされているとは限らない
   */
  protected emitTrackChangeEvent$$q(): void {
    this.dispatchEvent(new Event('trackChange'));
  }

  /**
   * `'repeatChange'`イベントを発火する
   */
  protected emitRepeatChangeEvent$$q(): void {
    this.dispatchEvent(new Event('repeatChange'));
  }

  /**
   * `'shuffleChange'`イベントを発火する
   */
  protected emitShuffleChangeEvent$$q(): void {
    this.dispatchEvent(new Event('shuffleChange'));
  }

  /**
   * リピート用のキューを埋める
   */
  private fillRepeatQueue$$q(): void {
    if (this._setList$$q.length === 0) {
      return;
    }

    do {
      const array = [...this._setList$$q];
      if (this._shuffle$$q) {
        shuffleArray(array);
        // セットリストの要素数が2以上ならばトラックが連続しないようにする
        // これいる？
        if (
          array.length > 1 &&
          this._repeatQueue$$q.length > 0 &&
          array[0] === this._repeatQueue$$q[this._repeatQueue$$q.length - 1]
        ) {
          const swapIndex = Math.floor(Math.random() * (array.length - 1)) + 1;
          [array[0], array[swapIndex]] = [array[swapIndex], array[0]];
        }
      }
      this._repeatQueue$$q.push(...array);
    } while (this._repeatQueue$$q.length < MIN_QUEUE_SIZE);
  }

  /**
   * キューと履歴（必要な場合）を再生成する \
   * リピートやシャッフルの設定が変更されたときに呼ぶ \
   * 次のトラックに進む場合や前のトラックに戻る場合には使用しない
   * @param shuffleChanged シャッフルが変更されたか
   */
  private regenerate$$q(shuffleChanged = true): void {
    // セットリストが空の場合はキューを空にして終了
    if (this._setList$$q.length === 0) {
      if (this._repeatQueue$$q.length === 0) {
        return;
      }

      this._repeatQueue$$q = [];
      this.emitQueueChangeEvent$$q();
      return;
    }

    const currentTrackId = this._currentTrack$$q;
    const repeatEnabled = this._repeat$$q !== 'off';

    // リピートが変更されただけのときはリピート用のキューを操作して終了
    if (!shuffleChanged) {
      // リピートの設定が「1曲のみ」なら何もせずに終了
      if (this._repeat$$q === 'one') {
        this.emitQueueChangeEvent$$q();
        return;
      }

      // 履歴を削除する
      this._history$$q = [];

      // リピートが有効化されたときは要素を追加、無効化されたときは削除
      // シャッフル有効時に要素の並びが変わらないように注意
      if (repeatEnabled) {
        this.fillRepeatQueue$$q();
      } else {
        this._repeatQueue$$q = [];
      }

      this.emitQueueChangeEvent$$q();
      return;
    }

    // シャッフルが変更されたとき

    // 履歴を削除する
    this._history$$q = [];

    // キューを再生成する
    if (this._shuffle$$q) {
      // シャッフルが有効な場合は現在のトラックを除くセットリストをシャッフルしてキューとする
      // 現在のトラックが存在しない場合は全てのセットリストの要素を用いる
      let array = [...this._setList$$q];
      if (currentTrackId) {
        array = array.filter((trackId) => trackId !== currentTrackId);
      }
      this._queue$$q = shuffleArray(array);
    } else {
      // シャッフルが無効な場合はセットリストのうち現在のトラックの1つ後から最後までの部分をキューとする
      // 現在のトラックが存在しない場合はセットリスト全体をキューとする
      // 現在のトラックがセットリストの最後にある場合は、キューを空にする（リピートが有効な場合はリピート用のキューでカバーできる）
      const currentTrackIndex = currentTrackId
        ? this._setList$$q.findIndex((trackId) => trackId === currentTrackId)
        : -1;
      this._queue$$q =
        currentTrackIndex >= 0
          ? this._setList$$q.slice(currentTrackIndex + 1)
          : [...this._setList$$q];
    }

    // リピート用のキューを再生成
    this._repeatQueue$$q = [];
    if (repeatEnabled) {
      this.fillRepeatQueue$$q();
    }

    this.emitQueueChangeEvent$$q();
  }

  /**
   * セットリストと現在のトラック（指定した場合）を変更する
   * @param setList 新しいセットリスト
   * @param currentTrack 新しい現在のトラック \
   * `null`なら現在のトラックを`undefined`に設定する \
   * `undefined`または省略した場合は現在のトラックを変更しない
   * @note
   * 新しい現在のトラックが指定されたセットリストに見つからなかった場合は、新しい現在のトラックには`undefined`が設定される \
   * また、現在のトラックを変更しない場合に、変更されたセットリストに元の現在のトラックが含まれない場合は、現在のトラックには新しく`undefined`が設定される
   * この関数を呼び出すと現在のトラックが切り替わったかどうかによらず常に'trackChange'イベントが発火する
   */
  setSetList$$q(
    setList: readonly TrackId[],
    currentTrack?: TrackId | null
  ): void {
    // 重複を除去
    const uniqueSetList = toUnique(setList);
    currentTrack =
      currentTrack === undefined
        ? this._currentTrack$$q
        : currentTrack || undefined;
    this._currentTrack$$q = currentTrack;
    this._setList$$q = uniqueSetList;
    this._queue$$q = [];
    this._repeatQueue$$q = [];
    this._history$$q = [];
    this.emitTrackChangeEvent$$q();
    this.regenerate$$q();
  }

  /**
   * キューの先頭にトラックを追加する
   * @param tracks 追加するトラックの配列
   */
  prependTracks$$q(tracks: readonly TrackId[]): void {
    if (this._repeat$$q === 'one') {
      throw new Error('prependTracks is not available with repeat one');
    }
    this._queue$$q.unshift(...tracks);
    this.emitQueueChangeEvent$$q();
  }

  /**
   * キューの末尾にトラックを追加する
   * @param tracks 追加するトラックの配列
   */
  appendTracks$$q(tracks: readonly TrackId[]): void {
    if (this._repeat$$q !== 'off') {
      throw new Error('appendTracks is not available with repeat enabled');
    }
    this._queue$$q.push(...tracks);
    this.emitQueueChangeEvent$$q();
  }

  /**
   * 次のトラックに進む（スキップ） \
   * オーバーライド対策
   * @param n スキップする曲数
   */
  private _skipNext$$q(n = 1): void {
    // nを正規化し、値を検証する
    n = Math.round(n);

    // 値が不正な場合は何もしない
    // `n !== 0`の場合は例外を投げても良いが
    if (!isFinite(n) || n < 1) {
      return;
    }

    // リピートの設定が「1曲のみ」の場合は、リピートの設定を「全て」に変更した上で実行する
    if (this._repeat$$q === 'one') {
      // ここではちゃんとsetterを呼び出す必要がある
      this.repeat$$q = 'all';
      // 変更を通知
      this.emitRepeatChangeEvent$$q();
      this._skipNext$$q(n);
      return;
    }

    // 指定された回数だけスキップ処理を行う
    for (let i = 0; i < n; i++) {
      // リピートが有効な場合はキューを補充
      if (
        this._repeat$$q !== 'off' &&
        this._queue$$q.length === 0 &&
        this._setList$$q.length > 0
      ) {
        this._queue$$q = this._repeatQueue$$q.splice(
          0,
          this._setList$$q.length
        );
        this.fillRepeatQueue$$q();
      }

      // トラックを履歴に追加
      if (this._currentTrack$$q) {
        this._history$$q.push(this._currentTrack$$q);
        this._history$$q.splice(0, this._history$$q.length - MAX_HISTORY_SIZE);
      }

      // キューからトラックを1つ取り出す
      const track = this._queue$$q.shift();
      this._currentTrack$$q = track;
    }

    this.emitQueueChangeEvent$$q();
    this.emitTrackChangeEvent$$q();
  }

  /**
   * 次のトラックに進む（スキップ） \
   * 自動で次のトラックに遷移するときの処理を行う場合は、`next$$q`を用いること \
   * （リピートの設定が「1曲のみ」に指定されている場合に、その設定を変更して遷移するか、スキップせずに同じ曲のままでいるかが異なる）
   * @param n スキップする曲数
   */
  skipNext$$q(n = 1): void {
    this._skipNext$$q(n);
  }

  /**
   * 前のトラックに戻る \
   * オーバーライド対策
   * @param n スキップする曲数
   */
  private _skipPrevious$$q(n = 1): void {
    // nを正規化し、値を検証する
    n = Math.round(n);

    // 値が不正な場合は何もしない
    // `n !== 0`の場合は例外を投げても良いが
    if (!isFinite(n) || n < 1) {
      return;
    }

    // リピートの設定が「1曲のみ」の場合は、リピートの設定を「全て」に変更した上で実行する
    if (this._repeat$$q === 'one') {
      // ここではちゃんとsetterを呼び出す必要がある
      this.repeat$$q = 'all';
      // 変更を通知
      this.emitRepeatChangeEvent$$q();
      this._skipPrevious$$q(n);
      return;
    }

    // 指定された回数だけスキップ処理を行う
    for (let i = 0; i < n; i++) {
      // 履歴がない場合は履歴を生成する
      // リピートが有効な場合はシャッフルの設定によらず生成する
      // リピートが無効な場合はシャッフルが無効で現在のトラックが存在して先頭でないときのみ生成する
      // セットリストが空の場合は生成しない（できない）
      // 現在のトラックが存在する場合、現在のトラックを含めずに履歴を生成する
      // 現在のトラックが存在しない場合があるのかどうかは不明だが一応その場合も問題なく動作するようにする
      // 生成する履歴が空になってはならない
      if (this._history$$q.length === 0 && this._setList$$q.length > 0) {
        const repeatEnabled = this._repeat$$q !== 'off';
        const currentTrackId = this._currentTrack$$q;
        if (this._shuffle$$q) {
          // シャッフルが有効な場合
          if (repeatEnabled) {
            /*
            // 現在のトラックを除くセットリストをシャッフルして履歴とする
            // 現在のトラックが存在しない場合は全てのセットリストの要素を用いる
            let array = [...this._setList$$q];
            if (currentTrackId) {
              array = array.filter(track => track.id !== currentTrackId);
            }
            shuffleArray(array);
            /*/
            // 現在のトラックを含む全てのセットリストの要素をシャッフルして履歴とする
            // 理由としては、セットリストにトラックが1つしかない場合への対処と、「前のトラックに戻る」を連発した場合に出目が一様にならないこと
            // ただし最後のトラックが現在のトラックと被らないようにはする
            const array = shuffleArray([...this._setList$$q]);
            const lengthMinus1 = array.length - 1;
            if (
              array.length > 1 &&
              currentTrackId &&
              array[lengthMinus1] === currentTrackId
            ) {
              const swapIndex = Math.floor(Math.random() * lengthMinus1);
              [array[lengthMinus1], array[swapIndex]] = [
                array[swapIndex],
                array[lengthMinus1],
              ];
            }
            //*/
            this._history$$q = array;
          }
        } else {
          // シャッフルが無効な場合
          const currentTrackIndex = currentTrackId
            ? this._setList$$q.findIndex(
                (trackId) => trackId === currentTrackId
              )
            : -1;
          if (repeatEnabled || currentTrackIndex > 0) {
            // セットリストのうち先頭から現在のトラックの1つ前までの部分を履歴とする
            // 現在のトラックが存在しない場合及び現在のトラックが先頭にある場合はセットリスト全体を履歴とする
            this._history$$q =
              currentTrackIndex > 0
                ? this._setList$$q.slice(0, currentTrackIndex)
                : [...this._setList$$q];
          }
        }
      }

      // トラックをキューに追加
      if (this._currentTrack$$q) {
        this._queue$$q.unshift(this._currentTrack$$q);
      }

      // 履歴からトラックを1つ取り出す
      const track = this._history$$q.pop();
      this._currentTrack$$q = track;
    }

    this.emitQueueChangeEvent$$q();
    this.emitTrackChangeEvent$$q();
  }

  /**
   * 前のトラックに戻る
   * @param n スキップする曲数
   */
  skipPrevious$$q(n = 1): void {
    this._skipPrevious$$q(n);
  }

  /**
   * 次のトラックに進む（自動再生） \
   * ユーザーによる「次のトラックに進む」を行う場合は、`skipNext$$q`を用いること \
   * （リピートの設定が「1曲のみ」に指定されている場合に、スキップせずに同じ曲のままでいるか、その設定を変更して遷移するかが異なる） \
   * TODO: リピートの設定が「1曲のみ」の場合、イベントを発火する以外何も行わないため、呼び出し側でリピートする処理を記述する必要がある \
   * （'trackChange'イベントで常に最初から再生させるようにすれば問題ないかも）
   */
  next$$q(): void {
    // リピートが「1曲のみ」のときは何も変更しない
    if (this._repeat$$q === 'one') {
      this.emitQueueChangeEvent$$q();
      this.emitTrackChangeEvent$$q();
      return;
    }

    // あえてオーバーライドされているかもしれない方を呼び出す
    this.skipNext$$q();
  }

  removeTracks$$q(filter: (trackId: TrackId) => boolean): void {
    let modified = false;
    const filterAndCheck = (array: TrackId[]): TrackId[] => {
      const result = array.filter(filter);
      if (result.length !== array.length) {
        modified = true;
        return result;
      }
      return array;
    };

    this._setList$$q = filterAndCheck(this._setList$$q);
    this._queue$$q = filterAndCheck(this._queue$$q);
    this._repeatQueue$$q = filterAndCheck(this._repeatQueue$$q);
    this._history$$q = filterAndCheck(this._history$$q);

    if (modified) {
      this.fillRepeatQueue$$q();
      if (this._currentTrack$$q && !filter(this._currentTrack$$q)) {
        this._skipNext$$q();
      } else {
        this.emitQueueChangeEvent$$q();
      }
    }
  }

  /**
   * 現在のトラック \
   * getterのみ
   */
  get currentTrack$$q(): TrackId | undefined {
    return this._currentTrack$$q;
  }

  /**
   * 現在のキュー \
   * getterのみ
   */
  get queue$$q(): readonly TrackId[] {
    return this._queueCache$$q;
  }

  /** シャッフル */
  get shuffle$$q(): boolean {
    return this._shuffle$$q;
  }

  /**
   * シャッフルのsetterでは変更があった際にキューの再生成が行われる \
   * （変更がなければそのまま）
   */
  set shuffle$$q(shuffle: boolean) {
    if (this._shuffle$$q === shuffle) {
      return;
    }
    this._shuffle$$q = shuffle;
    this.regenerate$$q(true);
  }

  /** リピート */
  get repeat$$q(): RepeatType {
    return this._repeat$$q;
  }

  /**
   * リピートのsetterでは変更があった際にキューの再生成が行われる \
   * （変更がなければそのまま）
   */
  set repeat$$q(repeat: RepeatType) {
    if (this._repeat$$q === repeat) {
      return;
    }
    this._repeat$$q = repeat;
    this.regenerate$$q(false);
  }

  export$$q(): TrackProviderState {
    return {
      repeat: this._repeat$$q,
      shuffle: this._shuffle$$q,
      currentTrack: this._currentTrack$$q ?? null,
      setList: this._setList$$q,
      queue: this._queue$$q,
      history: this._history$$q,
      repeatQueue: this._repeatQueue$$q,
    };
  }

  import$$q(state: TrackProviderState, emitTrackChange = true): void {
    this._repeat$$q = state.repeat;
    this._shuffle$$q = state.shuffle;
    this._currentTrack$$q = state.currentTrack ?? undefined;
    this._setList$$q = [...state.setList];
    this._queue$$q = [...state.queue];
    this._history$$q = [...state.history];
    this._repeatQueue$$q = [...state.repeatQueue];
    this.emitQueueChangeEvent$$q();
    if (emitTrackChange) {
      this.emitTrackChangeEvent$$q();
    }
    this.emitRepeatChangeEvent$$q();
    this.emitShuffleChangeEvent$$q();
  }
}

// `TrackProvider`の`addEventListener`メソッドのオーバーロードの定義
// class内には実装を記述しない限り記述できない
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface TrackProvider {
  /**
   * `currentTrack$$q`が変更された際のイベント
   */
  addEventListener(
    type: 'trackChange',
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void;

  /**
   * `queue$$q`が変更された際のイベント \
   * `repeat$$q`や`shuffle$$q`のsetterから呼ばれることもある
   */
  addEventListener(
    type: 'queueChange',
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void;

  /**
   * `TrackProvider`側で`repeat$$q`が変更された際のイベント \
   * `repeat$$q`のsetterからは呼ばれない
   */
  addEventListener(
    type: 'repeatChange',
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void;

  /**
   * `TrackProvider`側で`shuffle$$q`が変更された際のイベント \
   * `shuffle$$q`のsetterからは呼ばれない
   */
  addEventListener(
    type: 'shuffleChange',
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void;
}
