import { PrismaClient } from '@prisma/client';
import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import { generateImageId } from '$shared-server/generateId.js';
import { osDelete } from '$shared-server/objectStorage.js';
import {
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
} from '$shared-server/objectStorages.js';
import { is } from '$shared/is.js';
import { parseDate } from '$shared/parseDate.js';
import type {
  SourceFileAttachToType,
  SourceFileState,
  SourceFileType,
  SourceState,
} from '$shared/types/db.js';
import type { FFprobeTags } from '$transcoder/types/ffprobe.js';
import type {
  TranscoderResponse,
  TranscoderResponseArtifactAudio,
  TranscoderResponseArtifactError,
  TranscoderResponseArtifactImage,
} from '$transcoder/types/transcoder.js';
import { dbAlbumAddImageTx } from '$/db/album.js';
import { dbArtistAddImageTx } from '$/db/artist.js';
import { client } from '$/db/lib/client.js';
import type { TransactionalPrismaClient } from '$/db/lib/types.js';
import { dbPlaylistAddImageTx } from '$/db/playlist.js';
import { updateUserResourceTimestamp } from '$/db/resource.js';
import { dbTrackCreateTx } from '$/db/track.js';
import { API_ORIGIN, SECRET_TRANSCODER_CALLBACK_SECRET } from './env.js';

export const TRANSCODER_CALLBACK_API_PATH = '/internal/transcoder/callback';
export const TRANSCODER_CALLBACK_API_ENDPOINT = `${API_ORIGIN}${TRANSCODER_CALLBACK_API_PATH}`;
export const TRANSCODER_CALLBACK_API_TOKEN = `Bearer ${SECRET_TRANSCODER_CALLBACK_SECRET}`;

function numberOr<T>(str: string | null | undefined, fallback: T): number | T {
  if (!str) {
    return fallback;
  }
  const value = parseInt(str, 10);
  if (!isFinite(value)) {
    return fallback;
  }
  return value;
}

function floatOr<T>(str: string | null | undefined, fallback: T): number | T {
  if (!str) {
    return fallback;
  }
  const value = parseFloat(str);
  if (!isFinite(value)) {
    return fallback;
  }
  return value;
}

function parseDiscAndTrackNumber(
  tags: FFprobeTags
): [discNumber: number, trackNumber: number] {
  // possible formats of tags.track:
  // 2, 02, 2/4, 02/04, 1.2, 1.02, 01.2, 01.02

  let discNumber: number | undefined;
  let trackNumber: number | undefined;

  const strDisc = tags.disc?.replace(/\s/g, '');
  const strTrack = tags.track?.replace(/\s/g, '');
  if (strDisc) {
    discNumber = numberOr(strDisc, undefined);
  }
  if (strTrack) {
    const match = strTrack.match(/^(\d+)\.(\d+)/);
    if (match) {
      discNumber = numberOr(match[1], undefined);
      trackNumber = numberOr(match[2], undefined);
    } else {
      trackNumber = numberOr(strTrack, undefined);
    }
  }

  return [
    discNumber || 1, // ディスク番号が0またはundefinedのときは1にする
    trackNumber || 1, // トラック番号が0またはundefinedのときは1にする
  ];
}

async function registerImage(
  txClient: TransactionalPrismaClient,
  artifact: TranscoderResponseArtifactImage,
  imageId: string,
  attachToType: SourceFileAttachToType,
  attachToId: string
): Promise<void> {
  const { sourceFileId, region, userId } = artifact.source;

  // register image
  // DO NOT connect to target here, as it will be connected later
  await txClient.image.create({
    data: {
      id: imageId,
      sourceWidth: artifact.probe.width,
      sourceHeight: artifact.probe.height,
      dHash: artifact.dHash,
      user: { connect: { id: userId } },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceFile: {
        connect: {
          id: sourceFileId,
        },
      },
      files: {
        create: artifact.files.map((file) => ({
          id: file.fileId,
          region,
          format: file.formatName,
          mimeType: file.mimeType,
          extension: file.extension,
          fileSize: file.fileSize,
          sha256: file.sha256,
          width: file.width,
          height: file.height,
          user: { connect: { id: userId } },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })),
      },
    },
  });

  // add image to target
  switch (attachToType) {
    case 'album':
      await dbAlbumAddImageTx(txClient, userId, attachToId, imageId);
      break;

    case 'artist':
      await dbArtistAddImageTx(txClient, userId, attachToId, imageId);
      break;

    case 'playlist':
      await dbPlaylistAddImageTx(txClient, userId, attachToId, imageId);
      break;
  }
}

async function markSourceIdAsTranscodedTx(
  txClient: TransactionalPrismaClient | PrismaClient,
  userId: string,
  sourceId: string
): Promise<void> {
  await txClient.source.updateMany({
    where: {
      id: sourceId,
      userId,
      state: is<SourceState>('transcoding'),
    },
    data: {
      state: is<SourceState>('transcoded'),
      transcodeFinishedAt: Date.now(),
      updatedAt: Date.now(),
    },
  });
}

async function markSourceFileIdAsTx(
  txClient: TransactionalPrismaClient | PrismaClient,
  userId: string,
  sourceId: string,
  sourceFileId: string,
  newState: SourceFileState & ('transcoded' | 'failed')
): Promise<void> {
  await txClient.sourceFile.updateMany({
    where: {
      id: sourceFileId,
      userId,
      sourceId,
      state: is<SourceFileState>('transcoding'),
    },
    data: {
      state: newState,
      updatedAt: Date.now(),
    },
  });
}

async function handleTranscoderResponse(
  response: TranscoderResponse
): Promise<void> {
  const { artifacts } = response;

  const audioArtifacts = artifacts.filter(
    (artifact): artifact is TranscoderResponseArtifactAudio =>
      artifact.type === 'audio'
  );
  const imageArtifacts = artifacts.filter(
    (artifact): artifact is TranscoderResponseArtifactImage =>
      artifact.type === 'image'
  );
  const errorArtifacts = artifacts.filter(
    (artifact): artifact is TranscoderResponseArtifactError =>
      artifact.type === 'error'
  );

  await client.$transaction(async (txClient) => {
    const processedSourceIds = new Map<string, string>();

    // handle errors
    for (const artifact of errorArtifacts) {
      const {
        source: { sourceFileId, sourceId, userId },
      } = artifact;

      await markSourceFileIdAsTx(
        txClient,
        userId,
        sourceId,
        sourceFileId,
        'failed'
      );

      processedSourceIds.set(sourceId, userId);
    }

    // register album
    const sourceFileIdToAlbumIdMap = new Map<string, string>();
    for (const artifact of audioArtifacts) {
      const {
        source: {
          cueSheetSourceFileId,
          filename,
          options,
          region,
          sourceFileId,
          sourceId,
          userId,
        },
      } = artifact;

      processedSourceIds.set(sourceId, userId);

      await markSourceFileIdAsTx(
        txClient,
        userId,
        sourceId,
        sourceFileId,
        'transcoded'
      );

      if (cueSheetSourceFileId) {
        await markSourceFileIdAsTx(
          txClient,
          userId,
          sourceId,
          cueSheetSourceFileId,
          'transcoded'
        );
      }

      for (const artifactTrack of artifact.tracks) {
        const { duration, files, tags } = artifactTrack;

        const date = (tags.date && parseDate(tags.date)) || undefined;
        const [discNumber, trackNumber] = parseDiscAndTrackNumber(tags);

        const defaultUnknownTrackTitle = options.useFilenameAsUnknownTrackTitle
          ? filename
          : options.defaultUnknownTrackTitle;

        const tagTrackArtist = tags.artist;
        const tagTrackArtistSort = tags.artistsort;
        const tagAlbumArtist =
          tags.albumartist ||
          (options.useTrackArtistAsUnknownAlbumArtist && tagTrackArtist);
        const tagAlbumArtistSort =
          tags.albumartistsort ||
          (options.useTrackArtistAsUnknownAlbumArtist && tagTrackArtistSort);

        const tagTrackTitle = tags.title;
        const tagTrackTitleSort = tags.titlesort;
        const tagAlbumTitle =
          tags.album ||
          (options.useTrackTitleAsUnknownAlbumTitle && tagTrackTitle);
        const tagAlbumTitleSort =
          tags.albumtitlesort ||
          (options.useTrackTitleAsUnknownAlbumTitle && tagTrackTitleSort);

        const [track, trackArtist, album, albumArtist] = await dbTrackCreateTx(
          txClient,
          userId,
          tagAlbumTitle || options.defaultUnknownAlbumTitle,
          tagAlbumArtist || options.defaultUnknownAlbumArtist,
          tagTrackArtist || options.defaultUnknownTrackArtist,
          {
            title: tagTrackTitle || defaultUnknownTrackTitle,
            titleSort: tagTrackTitleSort || null,
            discNumber,
            trackNumber,
            duration,
            genre: tags.genre || null,
            bpm: numberOr(tags.bpm, null),
            releaseDate: date?.dateString$$q,
            releaseDatePrecision: date?.precision$$q,
            releaseDateText: date?.text$$q,
            replayGainGain: floatOr(tags.replaygain_track_gain, null),
            replayGainPeak: floatOr(tags.replaygain_track_peak, null),
            sourceFileId: artifact.source.sourceFileId,
          }
        );

        sourceFileIdToAlbumIdMap.set(sourceFileId, album.id);

        // update album
        {
          const newAlbumGain: number | null = !album.replayGainGain
            ? floatOr(tags.replaygain_album_gain, null)
            : null;
          const newAlbumPeak: number | null = !album.replayGainPeak
            ? floatOr(tags.replaygain_album_peak, null)
            : null;
          const newAlbumTitleSort: string | null = !album.titleSort
            ? tagAlbumTitleSort || null
            : null;
          if (
            newAlbumGain != null ||
            newAlbumPeak != null ||
            newAlbumTitleSort != null
          ) {
            await txClient.album.updateMany({
              where: { id: album.id, userId },
              data: {
                ...(newAlbumTitleSort != null
                  ? { albumTitleSort: newAlbumTitleSort }
                  : {}),
                ...(newAlbumGain != null
                  ? { replayGainGain: newAlbumGain }
                  : {}),
                ...(newAlbumPeak != null
                  ? { replayGainPeak: newAlbumPeak }
                  : {}),
                updatedAt: Date.now(),
              },
            });
          }
        }

        // update track artist
        if (!trackArtist.nameSort && tagTrackArtistSort) {
          await txClient.artist.updateMany({
            where: { id: trackArtist.id, userId },
            data: {
              nameSort: tagTrackArtistSort,
              updatedAt: Date.now(),
            },
          });
        }

        // update album artist
        if (albumArtist.id !== trackArtist.id || !tagTrackArtistSort) {
          if (!albumArtist.nameSort && tagAlbumArtistSort) {
            await txClient.artist.updateMany({
              where: { id: albumArtist.id, userId },
              data: {
                nameSort: tagAlbumArtistSort,
                updatedAt: Date.now(),
              },
            });
          }
        }

        // register track files
        // TODO(prod): use createMany
        for (const file of files) {
          await txClient.trackFile.create({
            data: {
              id: file.fileId,
              region,
              format: file.formatName,
              mimeType: file.mimeType,
              extension: file.extension,
              fileSize: file.fileSize,
              sha256: file.sha256,
              duration: file.duration,
              trackId: track.id,
              userId,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          });
        }
      }
    }

    // register images
    for (const artifact of imageArtifacts) {
      const { source } = artifact;
      const { extracted, region, sourceId, userId } = source;

      processedSourceIds.set(sourceId, userId);

      let attachToType: SourceFileAttachToType;
      let attachToId: string | undefined;

      if (extracted) {
        const deleteTranscodedFiles = async () => {
          // NOTE(ximg): currently we don't upload raw extracted images to S3. Delete them if we do.
          const os = getTranscodedImageFileOS(artifact.source.region);
          await Promise.allSettled(
            artifact.files.map((file) =>
              osDelete(
                os,
                getTranscodedImageFileKey(userId, file.fileId, file.extension)
              )
            )
          );
        };

        attachToType = 'album';

        attachToId = sourceFileIdToAlbumIdMap.get(source.audioSourceFileId);
        if (!attachToId) {
          // something went wrong with transcoding audio
          // this will not happen because the image file is not extracted when the audio transcoding fails
          await deleteTranscodedFiles();
          continue;
        }

        const album = await txClient.album.findFirst({
          where: { id: attachToId, userId },
          select: {
            images: {
              select: {
                id: true,
                sourceFile: {
                  select: {
                    id: true,
                    sha256: true,
                  },
                },
              },
            },
          },
        });

        // NOTE: we can use dHash here
        if (
          !album ||
          album.images
            .flatMap((image) => image.sourceFile)
            .some((file) => file.sha256 === source.sha256)
        ) {
          // album not found (= deleted during transcoding) or image already exists
          await deleteTranscodedFiles();
          continue;
        }

        // register extracted images as source files
        await txClient.sourceFile.create({
          data: {
            id: source.sourceFileId,
            state: is<SourceFileState>('transcoded'),
            type: is<SourceFileType>('image'),
            region,
            filename: source.filename,
            fileSize: source.fileSize,
            sha256: source.sha256,
            cueSheetFileId: null,
            attachToType,
            attachToId,
            entityExists: false,
            uploadId: null,
            sourceId,
            userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        });
      } else {
        const { sourceFileId } = source;
        ({ attachToType, attachToId } = source);

        await markSourceFileIdAsTx(
          txClient,
          userId,
          sourceId,
          sourceFileId,
          'transcoded'
        );
      }

      const imageId = await generateImageId();

      await registerImage(
        txClient,
        artifact,
        imageId,
        attachToType,
        attachToId
      );
    }

    for (const [sourceId, userId] of processedSourceIds) {
      await markSourceIdAsTranscodedTx(txClient, userId, sourceId);
    }
  });

  const userIdSet = new Set(
    artifacts.map((artifact) => artifact.source.userId)
  );
  for (const userId of userIdSet) {
    await updateUserResourceTimestamp(userId);
  }
}

function handleTranscoderResponseSync(response: TranscoderResponse): void {
  handleTranscoderResponse(response).catch((error) => {
    console.error(error);
  });
}

export const transcoderCallback: FastifyPluginCallback<{}> = (
  fastify: FastifyInstance,
  _options: {},
  done: (err?: Error) => void
): void => {
  fastify.post(TRANSCODER_CALLBACK_API_PATH, (request, reply) => {
    if (request.headers.authorization !== TRANSCODER_CALLBACK_API_TOKEN) {
      reply.code(401).send();
      return;
    }

    if (typeof request.body !== 'object') {
      reply.code(400).send();
      return;
    }

    handleTranscoderResponseSync(request.body as TranscoderResponse);

    reply.code(204).send();
  });

  done();
};
