import type { ResourceTrack } from '$/types';
import {
  AUDIO_SCORE_BASE,
  AUDIO_SCORE_BY_EXTENSION,
  AUDIO_SCORE_BY_FORMAT_PER_PREFERENCE,
  AudioQuality,
} from '~/config';
import { canPlayAudioType } from './canPlayAudioType';
import { getTrackFileURL } from './fileURL';

/**
 * `TrackFile`のスコアを計算する \
 * スコアが高いほどユーザーの設定とブラウザの対応状況に即した`TrackFileDTO`であることを表す \
 * 負数は使用不可の（ブラウザが対応していない）フォーマット
 * @param trackFile `TrackFile`
 * @returns スコア
 */
export function calcTrackFileScore(
  trackFile: ResourceTrack['files'][number],
  preference: AudioQuality
): number {
  // 再生不可なら-1
  if (!canPlayAudioType(trackFile.mimeType)) {
    return -1;
  }

  const score =
    AUDIO_SCORE_BASE +
    (AUDIO_SCORE_BY_EXTENSION[trackFile.extension] ?? 0) +
    (AUDIO_SCORE_BY_FORMAT_PER_PREFERENCE[preference]?.[trackFile.format] ?? 0);

  return score;
}

export function getBestTrackFileURL(
  userId: string,
  track: Pick<ResourceTrack, 'id' | 'files'>,
  preference: AudioQuality
): string {
  const trackFiles = track.files;

  // スコア降順でTrackFileとスコアの配列を用意
  let trackFilesWithScore = trackFiles
    .map((item) => ({
      score$$q: calcTrackFileScore(item, preference),
      trackFile$$q: item,
    }))
    .sort((a, b) => b.score$$q - a.score$$q);

  // 利用不可なものを除く
  trackFilesWithScore = trackFilesWithScore.filter(
    (object) => object.score$$q >= 0
  );

  // 利用できるものがない場合は例外を送出
  if (!trackFilesWithScore.length) {
    throw new Error('no available trackFile');
  }

  // 一番いいやつを選択
  const trackFile = trackFilesWithScore[0].trackFile$$q;

  return getTrackFileURL(userId, track.id, trackFile);
}
