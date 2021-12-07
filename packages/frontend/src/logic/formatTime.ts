/**
 * 時間（時刻ではない）をフォーマットして文字列に変換する \
 * 時間には0以上の値が与えられるものとし、小数点以下は切り捨てられる
 * @example
 * formatTime(0);           // '0:00'
 * formatTime(10);          // '0:10'
 * formatTime(100);         // '1:40'
 * formatTime(1000);        // '16:40'
 * formatTime(100, 100);    // '1:40'
 * formatTime(100, 1000);   // '01:40'
 * formatTime(-1);          // error
 * formatTime(1, -1);       // error
 * formatTime(2, 1);        // error
 * @param time 時間（秒）、0以上
 * @param max 最大時間、`time`以上、この時間をフォーマットしたものに桁や0埋めが合わせられる
 * @return フォーマットされた時間の文字列
 */
export function formatTime(time: number, max?: number): string {
  time = Math.floor(time);

  if (time < 0) {
    throw new Error('`time` must be greater than or equal to 0');
  }

  let hoursLength = 0;
  let minutesLength = 0;

  if (max !== undefined) {
    max = Math.floor(max);

    if (max < 0) {
      throw new Error('`max` must be greater than or equal to 0');
    }

    if (max < time) {
      throw new Error('`max` must be greater than or equal to `time`');
    }

    const maxHours = Math.floor(max / 60 / 60);
    const maxMinutes = Math.min(Math.floor(max / 60), 59);
    hoursLength = maxHours && Math.floor(maxHours).toString().length;
    minutesLength = maxMinutes && Math.floor(maxMinutes).toString().length;
  }

  const hours = Math.floor(time / 60 / 60);
  const minutes = Math.floor(time / 60) % 60;
  const seconds = time % 60;
  const hoursPrefix =
    hoursLength || hours
      ? hours.toString().padStart(hoursLength, '0') + ':'
      : '';
  return `${hoursPrefix}${minutes
    .toString()
    .padStart(minutesLength, '0')}:${seconds.toString().padStart(2, '0')}`;
}
