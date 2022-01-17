import type { ResourceTrack } from '$/types';
import { canPlayAudioType } from './canPlayAudioType';
import { getTrackFileURL } from './fileURL';

/**
 * `TrackFileDTO`のスコアを計算する \
 * スコアが高いほどユーザーの設定とブラウザの対応状況に即した`TrackFileDTO`であることを表す \
 * 負数は使用不可の（ブラウザが対応していない）フォーマット
 * @param trackFile `TrackFileDTO`
 * @returns スコア
 */
export function calcTrackFileScore(
  trackFile: ResourceTrack['files'][number]
): number {
  // 再生不可なら-1
  if (!canPlayAudioType(trackFile.mimeType)) {
    return -1;
  }

  const addition = trackFile.extension === '.weba' ? 1_000_000_000 : 0;

  // TODO: ユーザーの音質設定に応じて適切なスコアを出す
  return 1 / trackFile.fileSize + addition;
}

export function getBestTrackFileURL(
  userId: string,
  track: ResourceTrack
): string {
  const trackFiles = track.files;

  // スコア降順でTrackFileDTOとスコアの配列を用意
  let trackFilesWithScore = trackFiles
    .map((item) => ({
      score$$q: calcTrackFileScore(item),
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
