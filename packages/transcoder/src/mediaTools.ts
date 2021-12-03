import { existsSync } from 'node:fs';
import { calcDHash } from './dHash';
import { execAndLog } from './execAndLog';
import { FFprobeResult, normalizeFFprobeTags } from './types/ffprobe';
import type { ImageMagickResult } from './types/imageMagick';

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
  ? '/app/sRGB_ICC_v4_Appearance.icc'
  : 'sRGB_ICC_v4_Appearance.icc';

// ffprobe 関数

export async function probeAudio(
  userId: string,
  srcFileId: string,
  srcPath: string
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
    userId,
    srcFileId,
    'audio_probe'
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
  userId: string,
  srcFileId: string,
  srcPath: string,
  destPath: string,
  index: number
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
      // 出力先：ファイル
      destPath,
    ],
    ffprobeExtractImageTimeout,
    userId,
    srcFileId,
    `audio_extract_${index}`
  );
}

export async function transcodeAudio(
  userId: string,
  srcFileId: string,
  srcPath: string,
  destPath: string,
  comment: string | undefined,
  index: number,
  preArgs: string[],
  postArgs: string[]
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
    userId,
    srcFileId,
    'audio_transcode',
    {
      index,
    }
  );
}

// mkclean 関数

export async function cleanAudio(
  userId: string,
  srcFileId: string,
  srcPath: string,
  destPath: string,
  preArgs: string[]
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
    userId,
    srcFileId,
    'audio_clean'
  );
}

// ImageMagick 関数

export async function probeImage(
  userId: string,
  srcFileId: string,
  srcPath: string
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
    userId,
    srcFileId,
    'image_probe'
  );

  return JSON.parse(execResult.stdout$$q) as ImageMagickResult;
}

export async function calcImageDHash(
  userId: string,
  srcFileId: string,
  srcPath: string
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
      'gray',
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
    userId,
    srcFileId,
    'image_dhash'
  );

  return calcDHash(execResult.stdout$$q.replace(/\r/g, '').trim());
}

export async function transcodeImage(
  userId: string,
  srcFileId: string,
  srcPath: string,
  destPath: string,
  comment: string | undefined,
  width: number,
  height: number,
  quality: number
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
    userId,
    srcFileId,
    'image_transcode'
  );
}

if (process.env.NODE_ENV === 'development') {
  if (!existsSync(sRGBProfileFilepath)) {
    throw new Error(`sRGB color profile not found: ${sRGBProfileFilepath}`);
  }
}
