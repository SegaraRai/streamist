import { existsSync } from 'node:fs';
import { normalizeTextForSingleLine } from '$shared/normalize';
import { calcDHash } from './dHash';
import { UploadJSONStorage, execAndLog } from './execAndLog';
import type { FFprobeResult, FFprobeTags, ImageMagickResult } from './types';

const isProductionOrStagingEnv =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

const ffprobeProbeAudioTimeout = 5000;
const ffprobeExtractImageTimeout = 10000;
const ffprobeTranscodeAudioTimeout = 100000;
const imagemagickProbeImageTimeout = 5000;
const imagemagickTranscodeImageTimeout = 10000;
const mkcleanCleanAudioTimeout = 10000;

const ffmpegFile =
  isProductionOrStagingEnv || process.platform !== 'win32'
    ? 'ffmpeg'
    : 'ffmpeg.exe';
const ffprobeFile =
  isProductionOrStagingEnv || process.platform !== 'win32'
    ? 'ffprobe'
    : 'ffprobe.exe';
const imageMagickFile =
  isProductionOrStagingEnv || process.platform !== 'win32'
    ? 'magick'
    : 'magick.exe';
const mkcleanFile =
  isProductionOrStagingEnv || process.platform !== 'win32'
    ? 'mkclean'
    : 'mkclean.exe';
const sRGBProfileFilepath = isProductionOrStagingEnv
  ? process.env.PLATFORM_TYPE === 'lambda'
    ? '/var/task/sRGB_ICC_v4_Appearance.icc'
    : '/app/sRGB_ICC_v4_Appearance.icc'
  : 'sRGB_ICC_v4_Appearance.icc';

// ffprobe 関数

/**
 * タグをノーマライズする
 * - キーを小文字にし、英数字以外を除去する
 * - 値の両端の空白を除去する
 * - 空値（空白だけのものを含む）を削除する
 * - 同じキーのものは値が長いものを採用する
 * @param tags タグ
 * @returns ノーマライズしたタグ
 */
export function normalizeFFprobeTags(tags: FFprobeTags): FFprobeTags {
  return Object.fromEntries(
    Object.entries(tags)
      .map(([key, value]) => [
        key.toLowerCase().replace(/[^a-z\d]/g, ''),
        normalizeTextForSingleLine(value),
      ])
      .filter((e): e is [string, string] => !!e[1])
      .sort((a, b) => a[1].length - b[1].length)
  );
}

if (process.env.NODE_ENV === 'development') {
  if (!existsSync(sRGBProfileFilepath)) {
    throw new Error(`sRGB color profile not found: ${sRGBProfileFilepath}`);
  }
}

export async function probeAudio(
  srcPath: string,
  logStorage: UploadJSONStorage
): Promise<FFprobeResult> {
  const execResult = await execAndLog(
    ffprobeFile,
    [
      // 出力以外の内容を表示しない（標準出力を用いるため）
      '-v',
      'quiet',
      // JSONで出力
      '-print_format',
      'json',
      // formatを含める
      '-show_format',
      // streamsを含める
      '-show_streams',
      // 物によっては -count_frames でかなり遅くなることがあるので無効化
      // '-count_frames',
      // 入力ファイル
      srcPath,
    ],
    ffprobeProbeAudioTimeout,
    'audio_probe',
    logStorage
  );

  const result = JSON.parse(execResult.stdout$$q) as FFprobeResult;

  for (const stream of result.streams) {
    if (stream.tags) {
      stream.tags = normalizeFFprobeTags(stream.tags);
    }
  }

  if (result.format.tags) {
    result.format.tags = normalizeFFprobeTags(result.format.tags);
  }

  return result;
}

export async function extractImageFromAudio(
  srcPath: string,
  destPath: string,
  index: number,
  logStorage: UploadJSONStorage
): Promise<void> {
  await execAndLog(
    ffmpegFile,
    [
      // 上書きする
      // 万一プロンプトを求められた場合そこで処理が止まってしまうため一応
      '-y',
      // 進捗情報を出力しない
      // 標準（エラー）出力が汚れるため
      '-nostats',
      // 入力ファイル
      '-i',
      srcPath,
      // 音声なし
      '-an',
      // 画像はそのまま取り出す
      '-c:v',
      'copy',
      // 指定したストリーム（画像）のみ含まれるようにする
      '-map',
      `0:${index}`,
      // 肥大化を避けるためにメタデータは削除
      '-map_metadata',
      '-1',
      // 出力形式を指定
      '-f',
      'rawvideo',
      // 出力先：ファイル
      destPath,
    ],
    ffprobeExtractImageTimeout,
    `audio_extract_s${index}`,
    logStorage
  );
}

export async function transcodeAudio(
  trackIndex: number,
  formatName: string,
  srcPath: string,
  destPath: string,
  comment: string | undefined,
  index: number,
  preArgs: readonly string[],
  postArgs: readonly string[],
  logStorage: UploadJSONStorage
): Promise<void> {
  await execAndLog(
    ffmpegFile,
    [
      // 上書きする
      // 万一プロンプトを求められた場合そこで処理が止まってしまうため一応
      '-y',
      // 進捗情報を出力しない
      // 標準（エラー）出力が汚れるため
      '-nostats',
      // 入力の設定より前の引数（入力用の引数）
      ...preArgs,
      // 入力ファイル
      '-i',
      srcPath,
      // 画像や映像なし
      '-vn',
      // 指定したストリーム（音声）のみ含まれるようにする
      '-map',
      `0:${index}`,
      // 肥大化を避けるためにメタデータは削除
      '-map_metadata',
      '-1',
      // コメントがあれば設定
      ...(comment ? ['-metadata', `comment=${comment}`] : []),
      // 出力の設定より前の引数（出力用の引数）
      ...postArgs,
      // 出力先：ファイル
      destPath,
    ],
    ffprobeTranscodeAudioTimeout,
    `audio_transcode_s${index}_t${trackIndex}_${formatName}`,
    logStorage,
    {
      index,
      trackIndex,
    }
  );
}

// mkclean 関数

export async function cleanAudio(
  trackIndex: number,
  formatName: string,
  srcPath: string,
  destPath: string,
  preArgs: readonly string[],
  logStorage: UploadJSONStorage
): Promise<void> {
  await execAndLog(
    mkcleanFile,
    [
      // 引数
      ...preArgs,
      // 入力ファイル
      srcPath,
      // 出力先：ファイル
      destPath,
    ],
    mkcleanCleanAudioTimeout,
    `audio_clean_t${trackIndex}_${formatName}`,
    logStorage
  );
}

// ImageMagick 関数

export async function probeImage(
  srcPath: string,
  logStorage: UploadJSONStorage
): Promise<ImageMagickResult> {
  const execResult = await execAndLog(
    imageMagickFile,
    [
      'convert',
      // JSONパースのときに（特にコメント等が文字コードの関係で）邪魔になる可能性があるのでメタデータは削除
      '-strip',
      // 入力ファイル
      srcPath,
      // 出力先：標準出力
      'json:-',
    ],
    imagemagickProbeImageTimeout,
    'image_probe',
    logStorage
  );

  return JSON.parse(execResult.stdout$$q) as ImageMagickResult;
}

export async function calcImageDHash(
  srcPath: string,
  logStorage: UploadJSONStorage
): Promise<string> {
  const execResult = await execAndLog(
    imageMagickFile,
    [
      'convert',
      // 効果あるかわからないがとりあえずつけとく
      '-define',
      'jpeg:size=9x8',
      // EXIFの回転情報を元に回転する
      '-auto-orient',
      // -auto-orientでずれたジオメトリ（位置情報）を修正する（実はリサイズ時に修正されるっぽいので不要っぽい）
      '+repage',
      // -stripでカラープロファイルが失われるため予め変換する
      '-profile',
      sRGBProfileFilepath,
      // グレースケールで処理（PGMで出力）
      '-colorspace',
      'LinearGray',
      // 9x8にリサイズ
      // （末尾の!でアスペクト比を無視）
      '-thumbnail',
      '9x8!',
      // 8ビットに変換
      '-depth',
      '8',
      // 一応メタデータを削除しておく（-thumbnailで削除されるためどのみち不要）
      '-strip',
      // PNM（PGM）の出力形式をASCIIに
      // これをしないとバイナリ形式になる
      '-compress',
      'none',
      // 入力ファイル
      srcPath,
      // 出力先：標準出力
      'pnm:-',
    ],
    imagemagickProbeImageTimeout,
    'image_dhash',
    logStorage
  );

  return calcDHash(execResult.stdout$$q.replace(/\r/g, '').trim());
}

export async function transcodeImage(
  formatName: string,
  srcPath: string,
  destPath: string,
  comment: string | undefined,
  width: number,
  height: number,
  quality: number,
  logStorage: UploadJSONStorage
): Promise<void> {
  // 今のところ出力形式がJPEGで固定なので、それを前提にした仕様になっている
  await execAndLog(
    imageMagickFile,
    [
      'convert',
      /*
      // 元ファイルと出力がJPEGで、リサイズ後がかなり小さいときに早くなるらしい
      '-define',
      `jpeg:size=${width}x${height}`,
      //*/
      // EXIFの回転情報を元に回転する
      '-auto-orient',
      // -auto-orientでずれたジオメトリ（位置情報）を修正する（実はリサイズ時に修正されるっぽいので不要っぽい）
      '+repage',
      // -stripでカラープロファイルが失われるため予め変換する
      '-profile',
      sRGBProfileFilepath,
      // リサイズアルゴリズムがリニアRGBを前提としているため色空間をリニアRGBに変換する
      '-colorspace',
      'RGB',
      // 指定された大きさに縮小
      // （末尾の!でアスペクト比を無視）
      '-thumbnail',
      `${width}x${height}!`,
      // 色空間をリニアRGBとして扱う（なんかいつのバージョンからか必要になった）
      '-set',
      'colorspace',
      'RGB',
      // 色空間をリニアRGBからsRGBに戻す（実はJPEGなら不要っぽい）
      '-colorspace',
      'sRGB',
      // 8ビットに変換（一応）
      '-depth',
      '8',
      // 肥大化を避けるためにメタデータは削除（-thumbnailで削除されるため実は不要）
      '-strip',
      // コメントがあれば設定
      ...(comment ? ['-set', 'comment', comment] : []),
      // 出力品質を設定
      '-quality',
      `${quality}`,
      // 出力をプログレッシブJPEGに設定
      '-interlace',
      'JPEG',
      // 入力ファイル
      srcPath,
      // 出力先：ファイル
      destPath,
    ],
    imagemagickTranscodeImageTimeout,
    `image_transcode_${formatName}`,
    logStorage
  );
}
