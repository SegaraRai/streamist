import { filterFalsy } from '$shared/filter.js';
import type { FFprobeResult, FFprobeStreamAudio } from '../types/ffprobe.js';

export interface AudioFormat {
  /** フォーマットのID */
  readonly name: string;
  /** 用いる形式（aacやopus等） */
  readonly format: string;
  /** ピリオド付きの拡張子 */
  readonly extension: string;
  /** MIMEタイプ */
  readonly mimeType: string;
  /** ビットレート */
  readonly bitrate: string;
  /** FFmpegでの引数 */
  readonly ffArgs: string[];
  /** mkcleanでの引数、実行しない場合はnull */
  readonly cleanArgs: string[] | null;
}

type GetAudioFormat = (
  ffprobeResult: FFprobeResult,
  audioStreamInfo: FFprobeStreamAudio
) => AudioFormat | undefined;

const isProductionOrStagingEnv =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

const webaMimeType = 'audio/webm; codecs=opus';
const m4aMimeType = 'audio/mp4; codecs=mp4a.40.2';

//

function getAdequateSamplingRate(audioStreamInfo: FFprobeStreamAudio): number {
  const samplingRate = parseInt(audioStreamInfo.sample_rate, 10);
  // 44100の倍数なら44100、それ以外なら48000
  return isFinite(samplingRate) &&
    (samplingRate % 44100 === 0 || 44100 % samplingRate === 0)
    ? 44100
    : 48000;
}

//

function createV1OpusArgs(bitrate: string): string[] {
  // prettier-ignore
  return [
    '-f',   'webm', // not weba
    '-c:a', 'libopus',
    '-b:a', bitrate,
    '-af',  'aresample=resampler=soxr',
    '-ac',  '2',
    '-ar',  '48000',
  ];
}

function createV1AACArgs(
  bitrate: string,
  audioStreamInfo: FFprobeStreamAudio
): string[] {
  // prettier-ignore
  return [
    '-f',   'mp4',
    '-c:a', isProductionOrStagingEnv ? 'libfdk_aac' : 'aac',
    '-b:a', bitrate,
    '-af',  'aresample=resampler=soxr',
    '-ac',  '2',
    '-ar',  getAdequateSamplingRate(audioStreamInfo).toString(),

    '-movflags', 'faststart',
    '-empty_hdlr_name', '1',
  ];
}

//

function createV1OpusFormat(bitrate: string): AudioFormat {
  return {
    name: `v1-opus-${bitrate}`,
    format: 'opus',
    extension: '.weba',
    mimeType: webaMimeType,
    bitrate,
    ffArgs: createV1OpusArgs(bitrate),
    cleanArgs: [
      // redo the Clusters layout
      // NOTE: this makes file a bit larger
      '--remux',
      // WebM / WebA
      '--doctype',
      '4',
    ],
  };
}

function createV1AACFormat(
  bitrate: string,
  audioStreamInfo: FFprobeStreamAudio
): AudioFormat {
  return {
    name: `v1-aac-${bitrate}`,
    format: 'aac',
    extension: '.m4a',
    mimeType: m4aMimeType,
    bitrate,
    ffArgs: createV1AACArgs(bitrate, audioStreamInfo),
    cleanArgs: null,
  };
}

//

const transcodeAudioFormats: GetAudioFormat[] = [
  (
    _ffprobeResult: FFprobeResult,
    _audioStreamInfo: FFprobeStreamAudio
  ): AudioFormat => createV1OpusFormat('96k'),
  (
    _ffprobeResult: FFprobeResult,
    _audioStreamInfo: FFprobeStreamAudio
  ): AudioFormat => createV1OpusFormat('256k'),
  (
    _ffprobeResult: FFprobeResult,
    audioStreamInfo: FFprobeStreamAudio
  ): AudioFormat => createV1AACFormat('96k', audioStreamInfo),
  (
    _ffprobeResult: FFprobeResult,
    audioStreamInfo: FFprobeStreamAudio
  ): AudioFormat => createV1AACFormat('256k', audioStreamInfo),
];

export function getTranscodeAudioFormats(
  ffprobeResult: FFprobeResult,
  audioStreamInfo: FFprobeStreamAudio
): AudioFormat[] {
  return filterFalsy(
    transcodeAudioFormats.map((func) => func(ffprobeResult, audioStreamInfo))
  );
}
