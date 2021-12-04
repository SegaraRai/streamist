import type { FastifyInstance } from 'fastify';
import { generateImageId } from '$shared-server/generateId.js';
import type {
  TranscoderRequest,
  TranscoderResponse,
  TranscoderResponseArtifactAudio,
  TranscoderResponseArtifactImage,
} from '$transcoder/types/transcoder.js';
import { dbAlbumAddImageTx } from '$/db/album.js';
import { dbTrackCreateTx } from '$/db/track.js';
import { client } from '$/db/lib/client.js';
import type { SourceState, TransactionalPrismaClient } from '$/db/lib/types.js';
import type { Region } from '$shared/regions';
import { parseDate } from '$shared/parseDate';
import type { FFprobeTags } from '$transcoder/types/ffprobe';

export const transcoderCallbackURL = `${process.env.BASE_URL}/internal/transcoder/callback`;
export const transcoderCallbackSecret = `Bearer ${process.env.TRANSCODER_CALLBACK_SECRET}`;

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
  region: Region,
  userId: string,
  sourceId: string,
  albumId: string,
  imageId: string
): Promise<void> {
  // register image
  await txClient.image.create({
    data: {
      id: imageId,
      sourceWidth: artifact.probe.width,
      sourceHeight: artifact.probe.height,
      dHash: artifact.dHash,
      user: { connect: { id: userId } },
      albums: {
        connect: {
          albumId_imageId: {
            albumId,
            imageId,
          },
        },
      },
      source: {
        connect: {
          id: sourceId,
        },
      },
      files: {
        create: artifact.files.map((file) => ({
          id: file.fileId,
          region: region,
          format: file.formatName,
          mimeType: file.mimeType,
          fileSize: file.fileSize,
          sha256: file.sha256,
          width: file.width,
          height: file.height,
          user: { connect: { id: userId } },
        })),
      },
    },
  });

  // add image to album
  await dbAlbumAddImageTx(txClient, userId, albumId, imageId);
}

async function markSourceAs(
  txClient: TransactionalPrismaClient,
  request: TranscoderRequest,
  state: SourceState
): Promise<void> {
  await txClient.source.updateMany({
    where: {
      id: request.sourceId,
      userId: request.userId,
    },
    data: {
      state,
    },
  });
}

async function handleTranscoderResponseAudio(
  response: TranscoderResponse
): Promise<void> {
  const { artifacts, request } = response;

  await client.$transaction(async (txClient) => {
    const audioArtifacts = artifacts.filter(
      (artifact): artifact is TranscoderResponseArtifactAudio =>
        artifact.type === 'audio'
    );
    const imageArtifacts = artifacts.filter(
      (artifact): artifact is TranscoderResponseArtifactImage =>
        artifact.type === 'image'
    );

    // register album
    let albumId: string | undefined;
    for (const artifact of audioArtifacts) {
      for (const artifactTrack of artifact.tracks) {
        const { duration, files, tags } = artifactTrack;

        const date = (tags.date && parseDate(tags.date)) || undefined;
        const [discNumber, trackNumber] = parseDiscAndTrackNumber(tags);

        const [track, , album] = await dbTrackCreateTx(
          txClient,
          request.userId,
          request.sourceId,
          tags.album || request.options.defaultUnknownAlbumTitle,
          tags.albumartist || request.options.defaultUnknownAlbumArtist,
          tags.artist || request.options.defaultUnknownTrackArtist,
          {
            title: tags.title || request.options.defaultUnknownTrackTitle,
            titleSort: tags.titlesort || null,
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
          }
        );

        // update album
        {
          const albumGain = !album.replayGainGain
            ? floatOr(tags.replaygain_album_gain, null)
            : null;
          const albumPeak = !album.replayGainPeak
            ? floatOr(tags.replaygain_album_peak, null)
            : null;
          const albumTitleSort =
            !album.titleSort && tags.albumsort ? tags.albumsort : null;
          if (
            albumTitleSort != null ||
            albumGain != null ||
            albumPeak != null
          ) {
            await txClient.album.updateMany({
              where: { id: album.id, userId: request.userId },
              data: {
                ...(albumTitleSort != null ? { albumTitleSort } : {}),
                ...(albumGain != null ? { replayGainGain: albumGain } : {}),
                ...(albumPeak != null ? { replayGainPeak: albumPeak } : {}),
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
              region: request.region,
              format: file.formatName,
              mimeType: file.mimeType,
              fileSize: file.fileSize,
              sha256: file.sha256,
              duration: file.duration,
              trackId: track.id,
              userId: request.userId,
            },
          });
        }

        if (!albumId) {
          albumId = album.id;
        }
      }
    }

    // register images
    if (albumId) {
      for (const artifact of imageArtifacts) {
        if (artifact.request.extracted) {
          const sourceFileId = artifact.request.sourceFileId;
          await txClient.sourceFile.create({
            data: {
              id: sourceFileId,
              userId: request.userId,
              sourceId: request.sourceId,
              fileSize: artifact.request.fileSize,
              sha256: artifact.request.sha256,
              region: artifact.request.region,
            },
          });
        }

        const imageId = await generateImageId();
        await registerImage(
          txClient,
          artifact,
          request.region,
          request.userId,
          request.sourceId,
          albumId,
          imageId
        );
      }
    }

    // mark source as completed
    await markSourceAs(txClient, request, 'transcoded');
  });
}

async function handleTranscoderResponseImage(
  response: TranscoderResponse
): Promise<void> {
  const { artifacts, request } = response;

  if (request.type !== 'image') {
    // should not occur
    return;
  }

  await client.$transaction(async (txClient) => {
    for (const artifact of artifacts) {
      if (artifact.type !== 'image') {
        // should not occur
        continue;
      }

      const imageId = await generateImageId();
      await registerImage(
        txClient,
        artifact,
        request.region,
        request.userId,
        request.sourceId,
        request.albumId,
        imageId
      );
    }

    // mark source as completed
    await markSourceAs(txClient, request, 'transcoded');
  });
}

async function handleTranscoderResponse(
  response: TranscoderResponse
): Promise<void> {
  if (response.error != null) {
    return;
  }

  switch (response.request.type) {
    case 'audio':
      await handleTranscoderResponseAudio(response);
      break;

    case 'image':
      await handleTranscoderResponseImage(response);
      break;
  }
}

function handleTranscoderResponseSync(response: TranscoderResponse): void {
  handleTranscoderResponse(response).catch((error) => {
    console.error(error);
  });
}

export function registerTranscoderCallback(app: FastifyInstance): void {
  app.post('/internal/transcoder/callback', async (request, reply) => {
    if (
      request.headers['authorization'] !==
      process.env.TRANSCODER_CALLBACK_SECRET
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
}
