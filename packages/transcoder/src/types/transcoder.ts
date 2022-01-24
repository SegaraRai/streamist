import type { OSRegion } from '$shared/objectStorage';
import type { SourceFileAttachToType } from '$shared/types';
import type {
  FFprobeFormat,
  FFprobeResult,
  FFprobeStreamAudio,
  FFprobeTags,
} from './ffprobe';
import type { ImageMagickImage, ImageMagickResult } from './imageMagick';

/** options specific to transcoding or user's preference */
export interface TranscoderRequestOptions {
  /** set this true if the audio file is too large to store in /tmp */
  downloadAudioToNFS: boolean;
  extractImages: boolean;
  preferExternalCueSheet: boolean;
  useFilenameAsUnknownTrackTitle: boolean;
  useTrackArtistAsUnknownAlbumArtist: boolean;
  useTrackTitleAsUnknownAlbumTitle: boolean;
  defaultUnknownTrackArtist: string;
  defaultUnknownTrackTitle: string;
  defaultUnknownAlbumArtist: string;
  defaultUnknownAlbumTitle: string;
}

export interface TranscoderRequestFileAudio {
  type: 'audio';
  userId: string;
  sourceId: string;
  options: TranscoderRequestOptions;
  sourceFileId: string;
  region: OSRegion;
  fileSize: number;
  filename: string;
  cueSheetSourceFileId?: string | null;
}

export interface TranscoderRequestFileImage {
  type: 'image';
  userId: string;
  sourceId: string;
  options: TranscoderRequestOptions;
  sourceFileId: string;
  region: OSRegion;
  filename: string;
  fileSize: number;
  attachToType: SourceFileAttachToType;
  attachToId: string;
  attachPrepend: boolean;
  extracted: false;
}

export interface TranscoderRequestFileImageExtracted
  extends Omit<
    TranscoderRequestFileImage,
    'extracted' | 'attachToType' | 'attachToId'
  > {
  extracted: true;
  audioSourceFileId: string;
  filePath: string;
  sha256: string;
  streamIndex: number;
}

export type TranscoderRequestFile =
  | TranscoderRequestFileAudio
  | TranscoderRequestFileImage;

export type TranscoderRequestFileInternal =
  | TranscoderRequestFile
  | TranscoderRequestFileImageExtracted;

export interface TranscoderRequest {
  /** POST <callbackURL> */
  callbackURL: string;
  files: TranscoderRequestFile[];
}

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
  /** トラックID */
  id: string;
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
  source: TranscoderRequestFileAudio;
  tracks: TranscoderResponseArtifactAudioTrack[];
  probe: TranscoderResponseArtifactAudioProbe;
  sha256: string;
  strCueSheet?: string;
  cueSheetSHA256?: string;
}

export interface TranscoderResponseArtifactImage {
  type: 'image';
  source: TranscoderRequestFileImage | TranscoderRequestFileImageExtracted;
  id: string;
  files: TranscoderResponseArtifactImageFile[];
  probe: TranscoderResponseArtifactImageProbe;
  sha256: string;
  dHash: string;
}

export interface TranscoderResponseArtifactError {
  type: 'error';
  source: TranscoderRequestFileInternal;
  error: string;
}

export type TranscoderResponseArtifact =
  | TranscoderResponseArtifactAudio
  | TranscoderResponseArtifactImage
  | TranscoderResponseArtifactError;

export interface TranscoderResponse {
  request: TranscoderRequest;
  artifacts: TranscoderResponseArtifact[];
}
