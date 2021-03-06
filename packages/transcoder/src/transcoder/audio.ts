import { createHash } from 'node:crypto';
import { Stats } from 'node:fs';
import { rename, stat, unlink } from 'node:fs/promises';
import {
  generateSourceFileId,
  generateTrackId,
  generateTranscodedAudioFileId,
} from '$shared-server/generateId';
import {
  getSourceFileKey,
  getSourceFileOS,
  getTranscodedAudioFileKey,
  getTranscodedAudioFileOS,
} from '$shared-server/objectStorage';
import {
  osDeleteManaged,
  osGetData,
  osGetFile,
  osPutFile,
} from '$shared-server/osOperations';
import { CueSheet, parseCueSheet } from '$shared/cueParser';
import { validateCueSheet } from '$shared/cueSheetCheck';
import { decodeText } from '$shared/decodeText';
import { UploadJSONStorage, uploadJSON } from '../execAndLog';
import { calcFileHash } from '../fileHash';
import logger from '../logger';
import {
  cleanAudio,
  extractImageFromAudio,
  probeAudio,
  transcodeAudio,
} from '../mediaTools';
import { generateTempFilename, getTempFilepath } from '../tempFile';
import { TRANSCODED_FILE_CACHE_CONTROL } from '../transcodedFileConfig';
import type {
  FFprobeResult,
  FFprobeStreamAudio,
  FFprobeStreamVideo,
  FFprobeTags,
  TranscoderRequestFileAudio,
  TranscoderRequestFileImageExtracted,
  TranscoderResponseArtifactAudio,
  TranscoderResponseArtifactAudioTrack,
} from '../types';
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
          // ????????????????????????????????????????????????????????????
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

        // TODO(feat)?: ?????????????????????????????????????????????????????????
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
  audioInfo: FFprobeResult,
  audioStream: FFprobeStreamAudio,
  tags: FFprobeTags,
  cueSheet?: CueSheet
): Promise<TranscoderResponseArtifactAudioTrack[]> {
  // ???????????????
  const duration =
    audioStream.duration_ts != null && audioStream.time_base
      ? (parseInt(audioStream.duration_ts.toString(), 10) *
          parseInt(audioStream.time_base.split('/')[0], 10)) /
        parseInt(audioStream.time_base.split('/')[1], 10)
      : parseFloat(audioStream.duration || audioInfo.format.duration);

  // ??????????????????
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
    fileSize,
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
    const sourceAudioFilepath = getTempFilepath(
      `${sourceFileId}-${generateTempFilename()}`
    );

    createdFiles.push(sourceAudioFilepath);

    // ?????????????????????????????????????????????????????????????????????????????????????????????
    const [downloadedFileSize, sourceFileSHA256] = await osGetFile(
      getSourceFileOS(region),
      getSourceFileKey(userId, sourceId, sourceFileId),
      sourceAudioFilepath,
      'sha256'
    );
    if (downloadedFileSize !== fileSize) {
      throw new Error(
        `downloaded file size is not equal to the source file size: ${downloadedFileSize} !== ${fileSize}`
      );
    }

    // ????????????????????????????????????
    const audioInfo = await probeAudio(sourceAudioFilepath, logStorage);

    // ???????????????????????????????????????????????????
    // ?????????????????????????????????????????????????????????????????????????????????????????????
    const audioStream = audioInfo.streams.find(
      (stream) => stream.codec_type === 'audio'
    ) as FFprobeStreamAudio | undefined;
    if (!audioStream) {
      throw new TranscodeError('invalid audio file. no audio stream found.');
    }

    const tags: FFprobeTags = {
      // MP3???????????????????????????????????????????????????????????????????????????
      ...audioInfo.format.tags,
      // Ogg??????????????????????????????????????????????????????????????????????????????
      ...audioStream.tags,
    };

    // ???????????????????????????????????????????????????
    // ?????????????????????????????????????????????????????????????????????????????????
    const imageStreams = options.extractImages
      ? audioInfo.streams.filter(
          (stream): stream is FFprobeStreamVideo =>
            stream.codec_type === 'video' && !!stream.disposition.attached_pic
        )
      : [];

    // CUE???????????????
    // NOTE: ?????????????????????CUE??????????????????CUE?????????
    let strCueSheet: string | undefined;
    let cueSheetSHA256: string | undefined;
    if (options.preferExternalCueSheet && cueSheetSourceFileId) {
      // NOTE: ??????????????????????????????????????????????????????????????????
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

    // NOTE: parseCueSheet???????????????????????????????????????
    const cueSheet: CueSheet | undefined = strCueSheet
      ? parseCueSheet(strCueSheet)
      : undefined;

    const tracks = await createTracks(audioInfo, audioStream, tags, cueSheet);

    // ?????????????????????
    // TODO(perf)?: ?????????
    for (const [trackIndex, track] of tracks.entries()) {
      const {
        id: trackId,
        files,
        duration,
        clipStartTime,
        clipDuration,
      } = track;

      for (const audioFormat of getTranscodeAudioFormats(
        audioInfo,
        audioStream
      )) {
        const transcodedAudioFileId = await generateTranscodedAudioFileId();
        const transcodedAudioFilepath = getTempFilepath(
          `${transcodedAudioFileId}-${generateTempFilename()}${
            audioFormat.extension
          }`
        );

        /** ?????????????????????????????? */
        const preArgs = [];
        // ??????????????????????????????????????????????????????
        // ????????????????????????????????????????????????????????????????????????
        if (clipStartTime != null) {
          preArgs.push('-ss', clipStartTime.toFixed(16));
        }
        // ?????????????????????????????????????????????
        if (clipDuration != null) {
          preArgs.push('-t', clipDuration.toFixed(16));
        }

        const comment: string = [
          // userId,
          // sourceId,
          // sourceFileId,
          // trackId,
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

          // ???????????????????????????????????????????????????????????????
          await rename(transcodedAudioFilepath, tempFilepath);

          // mkclean????????????????????????????????????????????????
          await cleanAudio(
            trackIndex,
            audioFormat.name,
            tempFilepath,
            transcodedAudioFilepath,
            audioFormat.cleanArgs,
            logStorage
          );

          // ????????????????????????
          await unlink(tempFilepath);
        }

        const key = getTranscodedAudioFileKey(
          userId,
          trackId,
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

        files.push({
          fileId: transcodedAudioFileId,
          formatName: audioFormat.name,
          mimeType: audioFormat.mimeType,
          extension: audioFormat.extension,
          fileSize,
          bitrate: (fileSize / duration) * 8,
          duration,
          sha256,
        });
      }
    }

    // ??????????????????
    // TODO(perf)?: ?????????
    const extractedImageFiles: TranscoderRequestFileImageExtracted[] = [];
    for (const imageStream of imageStreams) {
      const imageFilepath = getTempFilepath(generateTempFilename());

      let imageFileStat: Stats;
      try {
        // ???????????????
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

      // NOTE(ximg): S3???????????????????????????????????????????????????????????????????????????

      const sha256 = await calcFileHash(imageFilepath, 'sha256');

      // ???????????????
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
      await osDeleteManaged(os, uploadedTranscodedAudioKeys, true);
    } catch (_error: unknown) {
      // ??????????????????????????????
    }

    throw error;
  }
}
