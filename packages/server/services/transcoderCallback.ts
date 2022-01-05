import { PrismaClient } from '@prisma/client';
import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import { generateImageId } from '$shared-server/generateId';
import { osDelete } from '$shared-server/objectStorage';
import {
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
} from '$shared-server/objectStorages';
import { CoArtistType } from '$shared/coArtist';
import { is } from '$shared/is';
import { parseDate } from '$shared/parseDate';
import type {
  SourceFileAttachToType,
  SourceFileState,
  SourceFileType,
  SourceState,
} from '$shared/types/db';
import type { FFprobeTags } from '$transcoder/types/ffprobe';
import type {
  TranscoderResponse,
  TranscoderResponseArtifactAudio,
  TranscoderResponseArtifactError,
  TranscoderResponseArtifactImage,
} from '$transcoder/types/transcoder';
import { dbAlbumAddImageTx } from '$/db/album';
import { dbArtistAddImageTx } from '$/db/artist';
import { client } from '$/db/lib/client';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import type { TransactionalPrismaClient } from '$/db/lib/types';
import { dbPlaylistAddImageTx } from '$/db/playlist';
import { dbTrackCreateTx } from '$/db/track';
import { API_ORIGIN, SECRET_TRANSCODER_CALLBACK_SECRET } from './env';

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
  attachToId: string,
  attachPrepend: boolean
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
      await dbAlbumAddImageTx(
        txClient,
        userId,
        attachToId,
        imageId,
        attachPrepend
      );
      break;

    case 'artist':
      await dbArtistAddImageTx(
        txClient,
        userId,
        attachToId,
        imageId,
        attachPrepend
      );
      break;

    case 'playlist':
      await dbPlaylistAddImageTx(
        txClient,
        userId,
        attachToId,
        imageId,
        attachPrepend
      );
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
          (options.useTrackArtistAsUnknownAlbumArtist && tagTrackArtist) ||
          undefined;
        const tagAlbumArtistSort =
          tags.albumartistsort ||
          (options.useTrackArtistAsUnknownAlbumArtist && tagTrackArtistSort) ||
          undefined;

        const tagTrackTitle = tags.title;
        const tagTrackTitleSort = tags.titlesort;
        const tagAlbumTitle =
          tags.album ||
          (options.useTrackTitleAsUnknownAlbumTitle && tagTrackTitle) ||
          undefined;
        const tagAlbumTitleSort =
          tags.albumtitlesort ||
          (options.useTrackTitleAsUnknownAlbumTitle && tagTrackTitleSort) ||
          undefined;

        const tagCoArtists: [CoArtistType, string, string | undefined][] = [];
        if (tags.arranger) {
          tagCoArtists.push(['#arranger', tags.arranger, tags.arrangersort]);
        }
        if (tags.composer) {
          tagCoArtists.push(['#composer', tags.composer, tags.composersort]);
        }
        if (tags.lyricist) {
          tagCoArtists.push(['#lyricist', tags.lyricist, tags.lyricistsort]);
        }

        const { track, trackArtist, album, albumArtist, coArtists } =
          await dbTrackCreateTx(txClient, userId, {
            albumTitle: tagAlbumTitle || options.defaultUnknownAlbumTitle,
            albumArtistName:
              tagAlbumArtist || options.defaultUnknownAlbumArtist,
            albumArtistNameSort: tagAlbumArtistSort,
            trackArtistName:
              tagTrackArtist || options.defaultUnknownTrackArtist,
            trackArtistNameSort: tagTrackArtistSort,
            coArtists: tagCoArtists,
            data: {
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
              sourceFile: { connect: { id: artifact.source.sourceFileId } },
            },
          });

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

        // update artists' sort names
        {
          const artistAndNameSorts = [
            [trackArtist, tagTrackArtistSort] as const,
            [albumArtist, tagAlbumArtistSort] as const,
            ...coArtists.map(
              ([_1, _2, artist, nameSort]) => [artist, nameSort] as const
            ),
          ];

          const processedArtistIdSet = new Set<string>();
          for (const [artist, nameSort] of artistAndNameSorts) {
            if (processedArtistIdSet.has(artist.id)) {
              continue;
            }

            if (artist.nameSort) {
              processedArtistIdSet.add(artist.id);
              continue;
            }

            if (!nameSort) {
              continue;
            }

            await txClient.artist.updateMany({
              where: { id: artist.id, userId },
              data: {
                nameSort,
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
      let attachPrepend: boolean;

      if (extracted) {
        const deleteTranscodedFiles = async () => {
          // NOTE(ximg): currently we don't upload raw extracted images to S3. Delete them if we do.
          const os = getTranscodedImageFileOS(artifact.source.region);
          await osDelete(
            os,
            artifact.files.map((file) =>
              getTranscodedImageFileKey(userId, file.fileId, file.extension)
            )
          );
        };

        attachToType = 'album';
        attachPrepend = false;

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
            attachPrepend,
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
        ({ attachToType, attachToId, attachPrepend } = source);

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
        attachToId,
        attachPrepend
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
    await dbResourceUpdateTimestamp(userId);
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
