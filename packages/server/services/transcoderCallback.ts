import type { FastifyInstance } from 'fastify';
import { generateImageId } from '$shared-server/generateId.js';
import { parseDate } from '$shared/parseDate';
import type { Region } from '$shared/regions';
import type { FFprobeTags } from '$transcoder/types/ffprobe';
import type {
  TranscoderResponse,
  TranscoderResponseArtifactAudio,
  TranscoderResponseArtifactImage,
} from '$transcoder/types/transcoder.js';
import { dbAlbumAddImageTx } from '$/db/album.js';
import { client } from '$/db/lib/client.js';
import type { SourceState, TransactionalPrismaClient } from '$/db/lib/types.js';
import { dbTrackCreateTx } from '$/db/track.js';
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
          region,
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
  userId: string,
  sourceId: string,
  state: SourceState,
  preState: SourceState
): Promise<void> {
  await txClient.source.updateMany({
    where: {
      id: sourceId,
      userId,
      state: preState,
    },
    data: {
      state,
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

  await client.$transaction(async (txClient) => {
    const markedSourceIdSet = new Set<string>();
    const markSourceIdAsTranscoded = async (
      userId: string,
      sourceId: string
    ) => {
      if (markedSourceIdSet.has(sourceId)) {
        return;
      }
      markedSourceIdSet.add(sourceId);
      await markSourceAs(
        txClient,
        userId,
        sourceId,
        'transcoded',
        'transcoding'
      );
    };

    // register album
    const sourceFileIdToAlbumIdMap = new Map<string, string>();
    for (const artifact of audioArtifacts) {
      const {
        source: { filename, options, region, sourceFileId, sourceId, userId },
      } = artifact;

      for (const artifactTrack of artifact.tracks) {
        const { duration, files, tags } = artifactTrack;

        const date = (tags.date && parseDate(tags.date)) || undefined;
        const [discNumber, trackNumber] = parseDiscAndTrackNumber(tags);

        const defaultUnknownTrackTitle = options.useFilenameAsUnknownTrackTitle
          ? filename
          : options.defaultUnknownTrackTitle;

        const [track, , album] = await dbTrackCreateTx(
          txClient,
          userId,
          sourceId,
          tags.album || options.defaultUnknownAlbumTitle,
          tags.albumartist || options.defaultUnknownAlbumArtist,
          tags.artist || options.defaultUnknownTrackArtist,
          {
            title: tags.title || defaultUnknownTrackTitle,
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

        sourceFileIdToAlbumIdMap.set(sourceFileId, album.id);

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
              where: { id: album.id, userId },
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
              region,
              format: file.formatName,
              mimeType: file.mimeType,
              fileSize: file.fileSize,
              sha256: file.sha256,
              duration: file.duration,
              trackId: track.id,
              userId,
            },
          });
        }
      }

      await markSourceIdAsTranscoded(userId, sourceId);
    }

    // register images
    for (const artifact of imageArtifacts) {
      const { source } = artifact;
      const { extracted, region, sourceId, userId } = source;

      let albumId;

      if (extracted) {
        albumId = sourceFileIdToAlbumIdMap.get(source.audioSourceFileId);
        if (!albumId) {
          // something went wrong with transcoding audio
          // TODO(prod): remove transcoded images
          // TODO(extractedImage)?: 抽出した画像ファイルをS3に上げる場合、削除
          continue;
        }

        // TODO(extractedImage)?: 抽出した画像ファイルをS3に上げる場合、DBに登録するならここ
      } else {
        albumId = source.albumId;
      }

      const imageId = await generateImageId();
      await registerImage(
        txClient,
        artifact,
        region,
        userId,
        sourceId,
        albumId,
        imageId
      );

      await markSourceIdAsTranscoded(userId, sourceId);
    }
  });
}

function handleTranscoderResponseSync(response: TranscoderResponse): void {
  handleTranscoderResponse(response).catch((error) => {
    console.error(error);
  });
}

export function registerTranscoderCallback(app: FastifyInstance): void {
  app.post(TRANSCODER_CALLBACK_API_PATH, (request, reply) => {
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
}
