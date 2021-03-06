import { PrismaClient } from '@prisma/client';
import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import {
  OSRegion,
  getTranscodedAudioFileKey,
  getTranscodedAudioFileOS,
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
} from '$shared-server/objectStorage';
import { osDeleteManaged } from '$shared-server/osOperations';
import { is } from '$shared/is';
import { parseDate } from '$shared/parseDate';
import type {
  SourceFileAttachToType,
  SourceFileState,
  SourceFileType,
  SourceState,
} from '$shared/types';
import { toUnique } from '$shared/unique';
import type {
  TranscoderResponse,
  TranscoderResponseArtifactAudio,
  TranscoderResponseArtifactError,
  TranscoderResponseArtifactImage,
} from '$transcoder/types';
import { dbAlbumAddImageTx } from '$/db/album';
import { dbArtistAddImageTx } from '$/db/artist';
import { client } from '$/db/lib/client';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { DBTimestamp, dbGetTimestamp } from '$/db/lib/timestamp';
import type { TransactionalPrismaClient } from '$/db/lib/types';
import { dbPlaylistAddImageTx } from '$/db/playlist';
import { CreateTrackInputCoArtist, dbTrackCreateTx } from '$/db/track';
import { osDeleteSourceFiles } from '$/os/sourceFile';
import { retryTransaction } from '$/services//transaction';
import { SECRET_TRANSCODER_CALLBACK_SECRET } from '$/services/env';
import { logger } from '$/services/logger';
import { updateMaxTrackId } from '$/services/maxTrack';
import { parseDiscAndTrackNumberEx } from '$/services/parseDiscTrackNumber';
import { floatOr, integerOr } from '$/services/parseNumber';

async function registerImage(
  txClient: TransactionalPrismaClient,
  artifact: TranscoderResponseArtifactImage,
  imageId: string,
  attachToType: SourceFileAttachToType,
  attachToId: string,
  attachPrepend: boolean,
  timestamp: DBTimestamp
): Promise<void> {
  const { sourceFileId, region, userId } = artifact.source;

  // register image
  // DO NOT connect to attach target here, as it will be connected later
  await txClient.image.create({
    data: {
      id: imageId,
      sourceWidth: artifact.probe.width,
      sourceHeight: artifact.probe.height,
      user: { connect: { id: userId } },
      createdAt: timestamp,
      updatedAt: timestamp,
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
          createdAt: timestamp,
          updatedAt: timestamp,
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
  sourceId: string,
  timestamp: DBTimestamp
): Promise<void> {
  await txClient.source.updateMany({
    where: {
      id: sourceId,
      userId,
    },
    data: {
      state: is<SourceState>('transcoded'),
      transcodeFinishedAt: timestamp,
      updatedAt: timestamp,
    },
  });
}

async function markSourceFileIdAsTx(
  txClient: TransactionalPrismaClient | PrismaClient,
  userId: string,
  sourceId: string,
  sourceFileId: string,
  newState: SourceFileState & ('transcoded' | 'failed'),
  timestamp: DBTimestamp
): Promise<void> {
  await txClient.sourceFile.updateMany({
    where: {
      id: sourceFileId,
      userId,
      sourceId,
    },
    data: {
      state: newState,
      updatedAt: timestamp,
    },
  });
}

async function deleteSourceFile(
  userId: string,
  sourceId: string,
  sourceFileId: string,
  region: OSRegion
): Promise<void> {
  try {
    await client.sourceFile.updateMany({
      where: {
        id: sourceFileId,
        sourceId,
        userId,
      },
      data: {
        entityExists: false,
      },
    });
  } catch (error) {
    logger.error(
      error,
      `deleteSourceFile: Failed to update sourceFile ${sourceFileId}`
    );
  }

  await osDeleteSourceFiles([
    {
      id: sourceFileId,
      sourceId,
      userId,
      region,
    },
  ]);
}

async function handleTranscoderResponseArtifactError(
  artifact: TranscoderResponseArtifactError
): Promise<void> {
  const {
    source: { region, sourceFileId, sourceId, userId },
  } = artifact;

  await retryTransaction(async (txClient): Promise<void> => {
    const timestamp = dbGetTimestamp();

    await markSourceFileIdAsTx(
      txClient,
      userId,
      sourceId,
      sourceFileId,
      'failed',
      timestamp
    );

    await markSourceIdAsTranscodedTx(txClient, userId, sourceId, timestamp);
  }).catch((error) => {
    logger.error(error, 'handleTranscoderResponseArtifactError');
  });

  await deleteSourceFile(userId, sourceId, sourceFileId, region);
}

/**
 * @param artifact
 * @returns albumId
 */
async function handleTranscoderResponseArtifactAudio(
  artifact: TranscoderResponseArtifactAudio
): Promise<string | undefined> {
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

  const deleteTranscodedFiles = async () => {
    const os = getTranscodedAudioFileOS(artifact.source.region);
    await osDeleteManaged(
      os,
      artifact.tracks.flatMap(({ files, id }) =>
        files.map((file) =>
          getTranscodedAudioFileKey(userId, id, file.fileId, file.extension)
        )
      ),
      true
    );

    await deleteSourceFile(userId, sourceId, sourceFileId, region);
  };

  const albumId = await retryTransaction(
    async (txClient): Promise<string | undefined> => {
      const timestamp = dbGetTimestamp();

      let albumId: string | undefined;

      for (const artifactTrack of artifact.tracks) {
        const { duration, files, id, tags } = artifactTrack;

        const date = tags.date ? parseDate(tags.date) : undefined;
        const [discNumber, trackNumber] = parseDiscAndTrackNumberEx(
          tags,
          filename,
          !!cueSheetSourceFileId,
          options
        );

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

        const tagCoArtists: CreateTrackInputCoArtist[] = [];
        if (tags.arranger) {
          tagCoArtists.push({
            role: '#arranger',
            artistName: tags.arranger,
            artistNameSort: tags.arrangersort,
          });
        }
        if (tags.composer) {
          tagCoArtists.push({
            role: '#composer',
            artistName: tags.composer,
            artistNameSort: tags.composersort,
          });
        }
        if (tags.lyricist) {
          tagCoArtists.push({
            role: '#lyricist',
            artistName: tags.lyricist,
            artistNameSort: tags.lyricistsort,
          });
        }

        const { track, trackArtist, album, albumArtist, coArtists } =
          await dbTrackCreateTx(txClient, userId, id, {
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
              comment: tags.comment || null,
              lyrics: tags.lyrics || tags.lyric || null,
              releaseDate: date?.dateString$$q ?? null,
              releaseDatePrecision: date?.precision$$q ?? null,
              releaseDateText: date?.text$$q ?? null,
              genre: tags.genre || null,
              bpm: integerOr(tags.bpm, null, 1),
              sensitive: false,
              replayGainGain: floatOr(tags.replaygain_track_gain, null),
              replayGainPeak: floatOr(tags.replaygain_track_peak, null),
              sourceFile: { connect: { id: artifact.source.sourceFileId } },
            },
          });

        // last write wins
        albumId = album.id;

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
                updatedAt: timestamp,
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
              ({ artist, input: { artistNameSort } }) =>
                [artist, artistNameSort] as const
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
                updatedAt: timestamp,
              },
            });
          }
        }

        // register track files
        await txClient.trackFile.createMany({
          data: files.map((file) => ({
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
            createdAt: timestamp,
            updatedAt: timestamp,
          })),
        });
      }

      await markSourceFileIdAsTx(
        txClient,
        userId,
        sourceId,
        sourceFileId,
        'transcoded',
        timestamp
      );

      if (cueSheetSourceFileId) {
        await markSourceFileIdAsTx(
          txClient,
          userId,
          sourceId,
          cueSheetSourceFileId,
          'transcoded',
          timestamp
        );
      }

      await markSourceIdAsTranscodedTx(txClient, userId, sourceId, timestamp);

      return albumId;
    }
  ).catch((error) => {
    logger.error(error, 'handleTranscoderResponseArtifactAudio');
    return undefined;
  });

  if (!albumId) {
    // transaction failed
    await deleteTranscodedFiles();
  }

  return albumId;
}

async function handleTranscoderResponseArtifactImage(
  artifact: TranscoderResponseArtifactImage,
  extractedFromAlbumId: string | undefined
): Promise<void> {
  const { source } = artifact;
  const { extracted, region, sourceId, sourceFileId, userId } = source;

  const deleteTranscodedFiles = async () => {
    // NOTE(ximg): currently we don't upload raw extracted images to S3. Delete them if we do.
    const os = getTranscodedImageFileOS(artifact.source.region);
    await osDeleteManaged(
      os,
      artifact.files.map((file) =>
        getTranscodedImageFileKey(
          userId,
          artifact.id,
          file.fileId,
          file.extension
        )
      ),
      true
    );

    await deleteSourceFile(userId, sourceId, sourceFileId, region);
  };

  const succeeded = await retryTransaction(
    async (txClient): Promise<boolean> => {
      const timestamp = dbGetTimestamp();

      let attachToType: SourceFileAttachToType;
      let attachToId: string | undefined;
      let attachPrepend: boolean;

      if (extracted) {
        attachToType = 'album';
        attachPrepend = false;

        attachToId = extractedFromAlbumId;
        if (!attachToId) {
          // something went wrong with transcoding audio
          // this may happen when we failed to register the album
          return false;
        }

        const album = await txClient.album.findFirst({
          where: { id: attachToId, userId },
          select: {
            images: {
              select: {
                image: {
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
            },
          },
        });

        if (
          !album ||
          album.images
            .flatMap(({ image }) => image.sourceFile)
            .some((file) => file.sha256 === source.sha256)
        ) {
          // album not found (= deleted during transcoding) or image already exists
          return false;
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
            sourceFileId: source.audioSourceFileId,
            uploadId: '',
            sourceId,
            userId,
            createdAt: timestamp,
            updatedAt: timestamp,
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
          'transcoded',
          timestamp
        );
      }

      await registerImage(
        txClient,
        artifact,
        artifact.id,
        attachToType,
        attachToId,
        attachPrepend,
        timestamp
      );

      await markSourceIdAsTranscodedTx(txClient, userId, sourceId, timestamp);

      return true;
    }
  ).catch((error) => {
    logger.error(error, 'handleTranscoderResponseArtifactImage');
    return false;
  });

  if (!succeeded) {
    // transaction failed
    await deleteTranscodedFiles();
  }
}

async function handleTranscoderResponse(
  response: TranscoderResponse
): Promise<void> {
  const { artifacts } = response;

  // ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  // ??????????????????????????????state???????????????updateMany??????????????????????????????
  // ??????callback??????????????????????????????????????????????????????????????????????????????????????????????????????
  {
    const sourceIds = toUnique(
      artifacts.map((artifact) => artifact.source.sourceId)
    );
    const sources = await client.source.findMany({
      where: { id: { in: sourceIds } },
      select: {
        state: true,
      },
    });

    if (
      sources.some((source) => source.state === is<SourceState>('transcoded'))
    ) {
      // already processed or being processed by another handler
      logger.info(sources, 'already processed');
      return;
    }
  }

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

  // handle errors
  for (const artifact of errorArtifacts) {
    try {
      await handleTranscoderResponseArtifactError(artifact);
    } catch (error) {
      logger.error(
        error,
        'TranscoderCallback: handleTranscoderResponseArtifactError failed'
      );
    }
  }

  // register album and tracks
  const trackAddedUserIdSet = new Set<string>();
  const sourceFileIdToAlbumIdMap = new Map<string, string | undefined>();
  for (const artifact of audioArtifacts) {
    try {
      const albumId = await handleTranscoderResponseArtifactAudio(artifact);
      trackAddedUserIdSet.add(artifact.source.userId);
      sourceFileIdToAlbumIdMap.set(artifact.source.sourceFileId, albumId);
    } catch (error) {
      logger.error(
        error,
        'TranscoderCallback: handleTranscoderResponseArtifactAudio failed'
      );
    }
  }

  // register images
  for (const artifact of imageArtifacts) {
    try {
      await handleTranscoderResponseArtifactImage(
        artifact,
        artifact.source.extracted
          ? sourceFileIdToAlbumIdMap.get(artifact.source.audioSourceFileId)
          : undefined
      );
    } catch (error) {
      logger.error(
        error,
        'TranscoderCallback: handleTranscoderResponseArtifactImage failed'
      );
    }
  }

  const userIdSet: ReadonlySet<string> = new Set(
    artifacts.map((artifact): string => artifact.source.userId)
  );
  for (const userId of userIdSet) {
    if (trackAddedUserIdSet.has(userId)) {
      await updateMaxTrackId(userId, true);
    }
    await dbResourceUpdateTimestamp(userId);
  }
}

function handleTranscoderResponseSync(response: TranscoderResponse): void {
  handleTranscoderResponse(response).catch((error): void => {
    logger.error(error, 'handleTranscoderResponse failed');
  });
}

export const transcoderCallbackPlugin: FastifyPluginCallback<{}> = (
  fastify: FastifyInstance,
  _options: {},
  done: (err?: Error) => void
): void => {
  const transcoderAuthorization = `Bearer ${SECRET_TRANSCODER_CALLBACK_SECRET}`;

  fastify.post('/', (request, reply): void => {
    if (
      request.headers['streamist-transcoder-authorization'] !==
      transcoderAuthorization
    ) {
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
