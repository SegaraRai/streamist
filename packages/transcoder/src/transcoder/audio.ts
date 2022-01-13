import { createHash } from 'node:crypto';
import { Stats } from 'node:fs';
import { rename, stat, unlink } from 'node:fs/promises';
import {
  generateSourceFileId,
  generateTrackId,
  generateTranscodedAudioFileId,
} from '$shared-server/generateId';
import {
  osDelete,
  osGetData,
  osGetFile,
  osPutFile,
} from '$shared-server/objectStorage';
import { CueSheet, parseCueSheet } from '$shared/cueParser';
import { validateCueSheet } from '$shared/cueSheetCheck';
import { decodeText } from '$shared/decodeText';
import {
  getSourceFileKey,
  getSourceFileOS,
  getTranscodedAudioFileKey,
  getTranscodedAudioFileOS,
} from '$shared/objectStorage';
import { retryS3NoReject } from '$shared/retry';
import { UploadJSONStorage, uploadJSON } from '../execAndLog';
import { calcFileHash } from '../fileHash';
import logger from '../logger';
import {
  cleanAudio,
  extractImageFromAudio,
  probeAudio,
  transcodeAudio,
} from '../mediaTools';
import {
  generateTempFilename,
  getNFSTempFilepath,
  getTempFilepath,
} from '../tempFile';
import { TRANSCODED_FILE_CACHE_CONTROL } from '../transcodedFileConfig';
import type {
  FFprobeStreamAudio,
  FFprobeStreamVideo,
  FFprobeTags,
} from '../types/ffprobe';
import type {
  TranscoderRequestFileAudio,
  TranscoderRequestFileImageExtracted,
  TranscoderResponseArtifactAudio,
  TranscoderResponseArtifactAudioTrack,
} from '../types/transcoder';
import { getTranscodeAudioFormats } from './audioFormats';
import { TranscodeError } from './error';

function createTracksFromCueSheet(
  cueSheet: CueSheet,
  audioStream: FFprobeStreamAudio,
  duration: number,
  tags: FFprobeTags = {}
): Promise<TranscoderResponseArtifactAudioTrack[]> {
  try {
    validateCueSheet(cueSheet);
  } catch (error: unknown) {
    throw new TranscodeError(
      error instanceof Error ? error.message : String(error)
    );
  }

  const file = cueSheet.files[0];

  const maxTrackNumber = Math.max(
    ...file.tracks.map((track) => track.trackNumber)
  );

  return Promise.all(
    file.tracks.map(
      async (track, index): Promise<TranscoderResponseArtifactAudioTrack> => {
        const index01Offset = track.offsetMap.get(1);
        if (index01Offset === undefined) {
          // 事前にチェックしているので起こらないはず
          throw new TranscodeError(
            'invalid cue sheet. TRACK has no INDEX 01 offset.'
          );
        }

        const nextIndex01Offset = file.tracks[index + 1]?.offsetMap.get(1);

        const currentTrackTime = index01Offset / 75;
        const nextTrackTime = nextIndex01Offset
          ? nextIndex01Offset / 75
          : duration;

        const trackDuration = nextTrackTime - currentTrackTime;

        const getTagFromCueSheet = (keys: string[]): string | undefined => {
          for (const key of keys) {
            const value = cueSheet.remMap.get(key);
            if (value) {
              return value;
            }
          }
          return undefined;
        };

        const getTagFromTrack = (keys: string[]): string | undefined => {
          for (const key of keys) {
            const value = track.remMap.get(key);
            if (value) {
              return value;
            }
          }
          return undefined;
        };

        const getTagFromTrackAndCueSheet = (
          keys: string[]
        ): string | undefined => {
          return getTagFromTrack(keys) || getTagFromCueSheet(keys);
        };

        // TODO(feat)?: タグがない場合に曲側のタグを持ってくる
        const trackTags: FFprobeTags = {
          album: cueSheet.title || tags.album || tags.title,
          albumartist: cueSheet.performer || tags.albumartist || tags.artist,
          artist:
            track.performer ||
            cueSheet.performer ||
            tags.albumartist ||
            tags.artist,
          title: track.title || cueSheet.title || tags.album || tags.title,
          //
          arranger: getTagFromTrackAndCueSheet(['ARRANGER']),
          composer: getTagFromTrackAndCueSheet(['COMPOSER']),
          lyricist: getTagFromTrackAndCueSheet(['LYRICIST']),
          //
          albumsort: getTagFromCueSheet(['TITLE_SORT', 'TITLESORT']),
          albumartistsort: getTagFromCueSheet([
            'PERFORMER_SORT',
            'PERFORMERSORT',
          ]),
          artistsort: getTagFromTrackAndCueSheet([
            'PERFORMER_SORT',
            'PERFORMERSORT',
          ]),
          titlesort: getTagFromTrackAndCueSheet(['TITLE_SORT', 'TITLESORT']),
          //
          arrangersort: getTagFromTrackAndCueSheet([
            'ARRANGER_SORT',
            'ARRANGERSORT',
          ]),
          composersort: getTagFromTrackAndCueSheet([
            'COMPOSER_SORT',
            'COMPOSERSORT',
          ]),
          lyricistsort: getTagFromTrackAndCueSheet([
            'LYRICIST_SORT',
            'LYRICISTSORT',
          ]),
          //
          comment: getTagFromTrackAndCueSheet(['COMMENT']),
          copyright: getTagFromTrackAndCueSheet(['COPYRIGHT']),
          date: getTagFromTrackAndCueSheet(['DATE']),
          genre: getTagFromTrackAndCueSheet(['GENRE']),
          //
          disc: getTagFromCueSheet(['DISCNUMBER', 'DISC_NUMBER', 'DISC']),
          //
          track: `${track.trackNumber}/${maxTrackNumber}`,
          //
          discid: cueSheet.remMap.get('DISCID'),
          catalog: cueSheet.remMap.get('CATALOG'),
          isrc: track.remMap.get('ISRC'),
        };

        return {
          id: await generateTrackId(),
          duration: trackDuration,
          streamIndex: audioStream.index,
          tags: trackTags,
          // to be filled later
          files: [],
          clipStartTime: index01Offset > 0 ? currentTrackTime : undefined,
          clipDuration:
            nextIndex01Offset !== undefined ? trackDuration : undefined,
        };
      }
    )
  );
}

async function createTracks(
  audioStream: FFprobeStreamAudio,
  tags: FFprobeTags,
  cueSheet?: CueSheet
): Promise<TranscoderResponseArtifactAudioTrack[]> {
  // 曲長（秒）
  const duration =
    (parseInt(audioStream.duration_ts.toString(), 10) *
      parseInt(audioStream.time_base.split('/')[0], 10)) /
    parseInt(audioStream.time_base.split('/')[1], 10);

  // トラック作成
  const tracks: TranscoderResponseArtifactAudioTrack[] = cueSheet
    ? await createTracksFromCueSheet(cueSheet, audioStream, duration)
    : [
        {
          id: await generateTrackId(),
          duration,
          streamIndex: audioStream.index,
          tags,
          // to be filled later
          files: [],
        },
      ];

  return tracks;
}

export async function processAudioRequest(
  file: TranscoderRequestFileAudio
): Promise<
  [TranscoderResponseArtifactAudio, TranscoderRequestFileImageExtracted[]]
> {
  const createdFiles: string[] = [];
  const uploadedTranscodedAudioKeys: string[] = [];

  const {
    cueSheetSourceFileId,
    options,
    region,
    sourceFileId,
    sourceId,
    userId,
  } = file;

  const logStorage: UploadJSONStorage = {
    userId,
    sourceId,
    sourceFileId,
    region,
  };

  await uploadJSON('audio_request', logStorage, {
    userId,
    input: file,
  });

  const os = getTranscodedAudioFileOS(region);

  try {
    const sourceAudioFilepath = options.downloadAudioToNFS
      ? getNFSTempFilepath(sourceFileId)
      : getTempFilepath(sourceFileId);

    createdFiles.push(sourceAudioFilepath);

    // ユーザーがアップロードした音楽ファイルをローカルにダウンロード
    const [, sourceFileSHA256] = await osGetFile(
      getSourceFileOS(region),
      getSourceFileKey(userId, sourceId, sourceFileId),
      sourceAudioFilepath,
      'sha256'
    );

    // 音楽ファイルの情報を解析
    const audioInfo = await probeAudio(sourceAudioFilepath, logStorage);

    // 音声ストリームのインデックスを取得
    // 複数ある場合は最初のものを用いる（そもそもあまり想定してない）
    const audioStream = audioInfo.streams.find(
      (stream) => stream.codec_type === 'audio'
    ) as FFprobeStreamAudio | undefined;
    if (!audioStream) {
      throw new TranscodeError('invalid audio file. no audio stream found.');
    }

    const tags: FFprobeTags = {
      // MP3コンテナとかはアーティストとかのタグがコンテナ単位
      ...audioInfo.format.tags,
      // Oggコンテナとかはアーティストとかのタグがストリーム単位
      ...audioStream.tags,
    };

    // 画像ストリームのインデックスを取得
    // 複数ある場合は対応可能なもの全て（あまり想定してない）
    const imageStreams = options.extractImages
      ? audioInfo.streams.filter(
          (stream): stream is FFprobeStreamVideo =>
            stream.codec_type === 'video' && !!stream.disposition.attached_pic
        )
      : [];

    // CUEシート抽出
    // NOTE: 優先順位は外部CUEシート→内部CUEシート
    let strCueSheet: string | undefined;
    let cueSheetSHA256: string | undefined;
    if (options.preferExternalCueSheet && cueSheetSourceFileId) {
      // NOTE: ダウンロードや変換で例外が発生する可能性あり
      const buffer = await osGetData(
        getSourceFileOS(region),
        getSourceFileKey(userId, sourceId, cueSheetSourceFileId)
      );
      cueSheetSHA256 = createHash('sha256').update(buffer).digest('hex');
      strCueSheet = decodeText(buffer);
    } else if (tags.cuesheet) {
      strCueSheet = tags.cuesheet;
      cueSheetSHA256 = createHash('sha256').update(strCueSheet).digest('hex');
    }

    // NOTE: parseCueSheetで例外が発生する可能性あり
    const cueSheet: CueSheet | undefined = strCueSheet
      ? parseCueSheet(strCueSheet)
      : undefined;

    const tracks = await createTracks(audioStream, tags, cueSheet);

    // トランスコード
    // TODO(perf)?: 並列化
    for (const [trackIndex, track] of tracks.entries()) {
      for (const audioFormat of getTranscodeAudioFormats(
        audioInfo,
        audioStream
      )) {
        const transcodedAudioFileId = await generateTranscodedAudioFileId();
        const transcodedAudioFilepath = getTempFilepath(
          `${transcodedAudioFileId}${audioFormat.extension}`
        );

        /** 入力ファイル用の引数 */
        const preArgs = [];
        // 必要に応じて切り出しの開始時間を設定
        // 入力ファイルの方の引数で指定すると処理が早くなる
        if (track.clipStartTime != null) {
          preArgs.push('-ss', track.clipStartTime.toFixed(16));
        }
        // 必要に応じて切り出す長さを設定
        if (track.clipDuration != null) {
          preArgs.push('-t', track.clipDuration.toFixed(16));
        }

        const comment: string = [
          userId,
          sourceId,
          sourceFileId,
          transcodedAudioFileId,
          audioFormat.name,
        ].join('\n');

        createdFiles.push(transcodedAudioFilepath);
        await transcodeAudio(
          trackIndex,
          audioFormat.name,
          sourceAudioFilepath,
          transcodedAudioFilepath,
          comment,
          audioStream.index,
          preArgs,
          audioFormat.ffArgs,
          logStorage
        );

        if (audioFormat.cleanArgs) {
          const tempFilepath = transcodedAudioFilepath + '.temp.weba';
          createdFiles.push(tempFilepath);

          // 先程変換して出力されたファイルの名前を変更
          await rename(transcodedAudioFilepath, tempFilepath);

          // mkcleanをかけて新たに音声ファイルを作成
          await cleanAudio(
            trackIndex,
            audioFormat.name,
            tempFilepath,
            transcodedAudioFilepath,
            audioFormat.cleanArgs,
            logStorage
          );

          // 元ファイルを削除
          await unlink(tempFilepath);
        }

        const key = getTranscodedAudioFileKey(
          userId,
          track.id,
          transcodedAudioFileId,
          audioFormat.extension
        );
        uploadedTranscodedAudioKeys.push(key);
        const [fileSize, sha256] = await osPutFile(
          os,
          key,
          transcodedAudioFilepath,
          {
            cacheControl: TRANSCODED_FILE_CACHE_CONTROL,
            contentType: audioFormat.mimeType,
          },
          'sha256'
        );

        await unlink(transcodedAudioFilepath);

        track.files.push({
          fileId: transcodedAudioFileId,
          formatName: audioFormat.name,
          mimeType: audioFormat.mimeType,
          extension: audioFormat.extension,
          fileSize,
          bitrate: (fileSize / track.duration) * 8,
          duration: track.duration,
          sha256,
        });
      }
    }

    // 画像抽出処理
    // TODO(perf)?: 並列化
    const extractedImageFiles: TranscoderRequestFileImageExtracted[] = [];
    for (const imageStream of imageStreams) {
      const imageFilepath = getTempFilepath(generateTempFilename());

      let imageFileStat: Stats;
      try {
        // 画像を抽出
        createdFiles.push(imageFilepath);
        await extractImageFromAudio(
          sourceAudioFilepath,
          imageFilepath,
          imageStream.index,
          logStorage
        );

        imageFileStat = await stat(imageFilepath);
      } catch (error: unknown) {
        // TODO(feat): log error
        logger.warn(error);
        await unlink(imageFilepath).catch((error) => {
          logger.info(error);
        });
        continue;
      }

      // NOTE(ximg): S3に抽出した画像ファイルをアップロードするならここで

      const sha256 = await calcFileHash(imageFilepath, 'sha256');

      // ジョブ追加
      extractedImageFiles.push({
        type: 'image',
        userId,
        sourceId,
        options,
        extracted: true,
        sourceFileId: await generateSourceFileId(),
        region,
        fileSize: imageFileStat.size,
        filename: '',
        sha256,
        audioSourceFileId: sourceFileId,
        filePath: imageFilepath,
        streamIndex: imageStream.index,
        attachPrepend: false,
      });
    }

    await unlink(sourceAudioFilepath);

    const artifact: TranscoderResponseArtifactAudio = {
      type: 'audio',
      source: file,
      tracks,
      probe: {
        ffprobeResult: audioInfo,
        formatInfo: audioInfo.format,
        streamInfo: audioStream,
      },
      sha256: sourceFileSHA256,
      strCueSheet,
      cueSheetSHA256,
    };

    await uploadJSON('audio_result', logStorage, {
      userId,
      input: file,
      artifact,
      extractedImageFiles,
    });

    return [artifact, extractedImageFiles];
  } catch (error: unknown) {
    try {
      await Promise.allSettled(createdFiles.map(unlink));
      await retryS3NoReject(() => osDelete(os, uploadedTranscodedAudioKeys));
    } catch (_error: unknown) {
      // エラーになっても良い
    }

    throw error;
  }
}
