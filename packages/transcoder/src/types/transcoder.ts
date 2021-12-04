import type { Region } from '$shared/regions.js';
import type {
  FFprobeFormat,
  FFprobeResult,
  FFprobeStreamAudio,
  FFprobeTags,
} from './ffprobe.js';
import type { ImageMagickImage, ImageMagickResult } from './imageMagick.js';

export interface TranscoderRequestOptions {
  callbackURL: string;
  extractImages: boolean;
  preferExternalCueSheet: boolean;
}

export interface TranscoderRequestAudio {
  type: 'audio';
  userId: string;
  sourceId: string;
  sourceFileId: string;
  cueSheetSourceFileId?: string | null;
  region: Region;
  options: TranscoderRequestOptions;
}

export interface TranscoderRequestImage {
  type: 'image';
  userId: string;
  sourceId: string;
  sourceFileId: string;
  /** empty for extracted file */
  albumId: string;
  region: Region;
  extracted: false;
  options: TranscoderRequestOptions;
}

export interface TranscoderRequestImageExtracted
  extends Omit<TranscoderRequestImage, 'extracted'> {
  extracted: true;
  filePath: string;
  sha256: string;
  streamIndex: number;
}

export type TranscoderRequest = TranscoderRequestAudio | TranscoderRequestImage;

export type TranscoderRequestInternal =
  | TranscoderRequestAudio
  | TranscoderRequestImage
  | TranscoderRequestImageExtracted;

export interface TranscoderResponseArtifactAudioFile {
  fileId: string;
  formatName: string; // e.g. 'v1-opus-256k'
  mimeType: string;
  extension: string;
  fileSize: number;
  sha256: string;
  duration: number;
  bitrate: number;
}

export interface TranscoderResponseArtifactImageFile {
  fileId: string;
  formatName: string; // e.g. 'v1-jpeg-600'
  mimeType: string;
  extension: string;
  fileSize: number;
  sha256: string;
  width: number;
  height: number;
}

export interface TranscoderResponseArtifactAudioProbe {
  /** ffprobeの解析結果 */
  ffprobeResult: FFprobeResult;
  /** ffprobeのストリームの解析結果 */
  streamInfo: FFprobeStreamAudio;
  /** ffprobeのフォーマットの解析結果 */
  formatInfo: FFprobeFormat;
}

export interface TranscoderResponseArtifactImageProbe {
  width: number;
  height: number;
  /** 対象の画像のメタデータ */
  metadata: ImageMagickImage;
  /** 全てのメタデータ */
  allMetadata: ImageMagickResult;
}

export interface TranscoderResponseArtifactAudioTrack {
  /** ffprobeでのストリーム番号 */
  streamIndex: number;
  /** タグ情報 */
  tags: FFprobeTags;
  /** 曲長（秒） */
  duration: number;
  /**
   * 元ファイルのどこから始まっているか（秒） \
   * つまりFFmpegの-ssの引数 \
   * 処理の過程であると便利なので
   */
  clipStartTime?: number;
  /**
   * 元ファイルのうち用いる長さ（秒） \
   * つまりFFmpegの-tの引数 \
   * 処理の過程であると便利なので \
   * `duration`も同じものを表すが、最後の部分で-tを省略できるように別に設ける（そのときこれは`undefined`になる）
   */
  clipDuration?: number;
  files: TranscoderResponseArtifactAudioFile[];
}

export interface TranscoderResponseArtifactAudio {
  type: 'audio';
  request: TranscoderRequestAudio;
  tracks: TranscoderResponseArtifactAudioTrack[];
  probe: TranscoderResponseArtifactAudioProbe;
  sha256: string;
  strCueSheet?: string;
  cueSheetSHA256?: string;
}

export interface TranscoderResponseArtifactImage {
  type: 'image';
  request: TranscoderRequestImage | TranscoderRequestImageExtracted;
  files: TranscoderResponseArtifactImageFile[];
  probe: TranscoderResponseArtifactImageProbe;
  sha256: string;
  dHash: string;
}

export type TranscoderResponseArtifact =
  | TranscoderResponseArtifactAudio
  | TranscoderResponseArtifactImage;

export interface TranscoderResponse {
  request: TranscoderRequest;
  artifacts: TranscoderResponseArtifact[];
}
