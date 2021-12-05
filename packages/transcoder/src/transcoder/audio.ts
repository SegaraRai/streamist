import { createHash } from 'node:crypto';
import { Stats } from 'node:fs';
import { rename, stat, unlink } from 'node:fs/promises';
import { generateTranscodedAudioFileId } from '$shared-server/generateId.js';
import {
  osGetData,
  osGetFile,
  osPutFile,
} from '$shared-server/objectStorage.js';
import {
  getSourceFileKey,
  getSourceFileOS,
  getTranscodedAudioFileKey,
  getTranscodedAudioFileOS,
} from '$shared-server/objectStorages.js';
import { CueSheet, parseCueSheet } from '$shared/cueParser.js';
import { decodeText } from '$shared/decodeText.js';
import logger from '../logger.js';
import {
  cleanAudio,
  extractImageFromAudio,
  probeAudio,
  transcodeAudio,
} from '../mediaTools.js';
import {
  generateTempFilename,
  getNFSTempFilepath,
  getTempFilepath,
} from '../tempFile.js';
import { TRANSCODED_FILE_CACHE_CONTROL } from '../transcodedFileConfig.js';
import type {
  FFprobeStreamAudio,
  FFprobeStreamVideo,
  FFprobeTags,
} from '../types/ffprobe.js';
import type {
  TranscoderRequestFileAudio,
  TranscoderRequestFileImageExtracted,
  TranscoderResponseArtifactAudio,
  TranscoderResponseArtifactAudioTrack,
} from '../types/transcoder.js';
import { getTranscodeAudioFormats } from './audioFormats.js';
import { TranscodeError } from './error.js';

function createTracksFromCueSheet(
  cueSheet: CueSheet,
  audioStream: FFprobeStreamAudio,
  duration: number,
  tags: FFprobeTags = {}
): TranscoderResponseArtifactAudioTrack[] {
  // TODO: 以下のチェック処理をsharedに移動し、クライアント側で同じチェックを行う

  // FILEコマンドがなければエラー
  if (cueSheet.files.length === 0) {
    throw new TranscodeError(
      'invalid cue sheet. the cue sheet has no FILE command.'
    );
  }

  // FILEコマンドが2つ以上存在すればエラー
  if (cueSheet.files.length !== 1) {
    throw new TranscodeError(
      'unsupported cue sheet. the cue sheet has too many FILE commands.'
    );
  }

  const cueSheetTracks = cueSheet.files.flatMap((file) => file.tracks);

  // TRACKが存在しなければエラー
  if (cueSheetTracks.length === 0) {
    throw new TranscodeError('unsupported cue sheet. no TRACK found.');
  }

  if (cueSheetTracks.some((track) => !track.offsetMap.has(1))) {
    // INDEX 01がないTRACKが存在すればエラー
    throw new TranscodeError(
      'unsupported cue sheet. INDEX 01 is missing in TRACK.'
    );
  }

  const file = cueSheet.files[0];

  const maxTrackNumber = Math.max(
    ...file.tracks.map((track) => track.trackNumber)
  );

  return file.tracks.map(
    (track, index): TranscoderResponseArtifactAudioTrack => {
      const index01Offset = track.offsetMap.get(1);
      if (index01Offset === undefined) {
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
  );
}

function createTracks(
  audioStream: FFprobeStreamAudio,
  tags: FFprobeTags,
  cueSheet?: CueSheet
): TranscoderResponseArtifactAudioTrack[] {
  // 曲長（秒）
  const duration =
    (parseInt(audioStream.duration_ts.toString(), 10) *
      parseInt(audioStream.time_base.split('/')[0], 10)) /
    parseInt(audioStream.time_base.split('/')[1], 10);

  // トラック作成
  const tracks: TranscoderResponseArtifactAudioTrack[] = cueSheet
    ? createTracksFromCueSheet(cueSheet, audioStream, duration)
    : [
        {
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

  try {
    const {
      cueSheetSourceFileId,
      options,
      region,
      sourceFileId,
      sourceId,
      userId,
    } = file;

    const sourceAudioFilepath = options.downloadAudioToNFS
      ? getNFSTempFilepath(sourceFileId)
      : getTempFilepath(sourceFileId);

    createdFiles.push(sourceAudioFilepath);

    // ユーザーがアップロードした音楽ファイルをローカルにダウンロード
    const [, sourceFileSHA256] = await osGetFile(
      getSourceFileOS(region),
      getSourceFileKey(userId, sourceFileId),
      sourceAudioFilepath,
      'sha256'
    );

    // 音楽ファイルの情報を解析
    const audioInfo = await probeAudio(
      userId,
      sourceFileId,
      sourceAudioFilepath
    );

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

    const extractedImageFiles: TranscoderRequestFileImageExtracted[] = [];

    // 画像抽出処理
    // TODO(pref)?: 並列化
    for (const imageStream of imageStreams) {
      const imageFilepath = getTempFilepath(generateTempFilename());

      let imageFileStat: Stats;
      try {
        // 画像を抽出
        await extractImageFromAudio(
          userId,
          sourceFileId,
          sourceAudioFilepath,
          imageFilepath,
          imageStream.index
        );

        imageFileStat = await stat(imageFilepath);
      } catch (error: unknown) {
        // TODO(feat): log error
        logger.warn(error);
        continue;
      }

      // TODO(extractedImage): S3に抽出した画像ファイルをアップロードするならここで

      // ジョブ追加
      extractedImageFiles.push({
        type: 'image',
        userId,
        sourceId,
        options,
        extracted: true,
        // TODO(extractedImage): 抽出した画像ファイルを別のsourceFileとして扱うならIDを生成してここを変更する
        // このIDがサーバー側で参照され、トランスコード後のファイル群の親sourceFileとして扱われる
        sourceFileId,
        region,
        fileSize: imageFileStat.size,
        filename: '',
        sha256: '',
        albumId: '',
        audioSourceFileId: sourceFileId,
        filePath: imageFilepath,
        streamIndex: imageStream.index,
      });
    }

    // CUEシート抽出
    // NOTE: 優先順位は外部CUEシート→内部CUEシート
    let strCueSheet: string | undefined;
    let cueSheetSHA256: string | undefined;
    if (options.preferExternalCueSheet && cueSheetSourceFileId) {
      // NOTE: ダウンロードや変換で例外が発生する可能性あり
      const buffer = await osGetData(
        getSourceFileOS(region),
        getSourceFileKey(userId, cueSheetSourceFileId)
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
    // TODO(pref)?: 並列化
    for (const track of tracks) {
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

        await transcodeAudio(
          userId,
          sourceFileId,
          sourceAudioFilepath,
          transcodedAudioFilepath,
          comment,
          audioStream.index,
          preArgs,
          audioFormat.ffArgs
        );

        if (audioFormat.cleanArgs) {
          const tempFilepath = transcodedAudioFilepath + '.temp.weba';

          // 先程変換して出力されたファイルの名前を変更
          await rename(transcodedAudioFilepath, tempFilepath);

          // mkcleanをかけて新たに音声ファイルを作成
          await cleanAudio(
            userId,
            sourceFileId,
            tempFilepath,
            transcodedAudioFilepath,
            audioFormat.cleanArgs
          );

          // 元ファイルを削除
          await unlink(tempFilepath);
        }

        createdFiles.push(transcodedAudioFilepath);

        const fileStat = await stat(transcodedAudioFilepath);

        const [, sha256] = await osPutFile(
          getTranscodedAudioFileOS(region),
          getTranscodedAudioFileKey(
            userId,
            transcodedAudioFileId,
            audioFormat.extension
          ),
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
          fileSize: fileStat.size,
          bitrate: (fileStat.size / track.duration) * 8,
          duration: track.duration,
          sha256,
        });
      }
    }

    await unlink(sourceAudioFilepath);

    return [
      {
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
      },
      extractedImageFiles,
    ];
  } catch (error: unknown) {
    try {
      await Promise.allSettled(createdFiles.map(unlink));
    } catch (_error: unknown) {
      // エラーになっても良い
    }

    throw error;
  }
}
