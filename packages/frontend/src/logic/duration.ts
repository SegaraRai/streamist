import humanizeDuration from 'humanize-duration';
import type { ResourceTrack } from '$/types';

/**
 * 合計トラック長（秒）を分単位でフォーマットした文字列に変換する
 * @param duration 合計トラック長（秒）
 * @returns 合計トラック長を分単位でフォーマットした文字列
 */
export function formatTotalDuration(
  duration: number,
  language: string
): string {
  return humanizeDuration(duration * 1000, {
    language,
    fallbacks: ['en'],
    units: ['h', 'm'],
    delimiter: ' ',
    round: true,
  });
}

/**
 * トラック長の合計を計算する
 * @param tracks トラックの配列
 * @returns トラック長の合計（秒）
 */
export function calcTracksTotalDuration(
  tracks: readonly Pick<ResourceTrack, 'duration'>[]
): number {
  return tracks.reduce((acc, track) => acc + track.duration, 0);
}

/**
 * トラック長の合計を計算してを分単位でフォーマットした文字列に変換する
 * @param tracks トラックの配列
 * @returns 合計トラック長を分単位でフォーマットした文字列
 */
export function formatTracksTotalDuration(
  tracks: readonly Pick<ResourceTrack, 'duration'>[],
  language: string
): string {
  return formatTotalDuration(calcTracksTotalDuration(tracks), language);
}
