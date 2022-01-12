import { Prisma } from '@prisma/client';
import { is } from '$shared/is';
import {
  OSRegion,
  getSourceFileKey,
  getSourceFileOS,
} from '$shared/objectStorage';
import { retryS3NoReject } from '$shared/retry';
import {
  SOURCE_FILE_TREAT_AS_NOT_TRANSCODED_AFTER_UPLOAD,
  SOURCE_FILE_TREAT_AS_NOT_UPLOADED_AFTER_CREATE,
} from '$shared/sourceFileConfig';
import { SourceFileState, SourceState } from '$shared/types/db';
import { client } from '$/db/lib/client';
import { createUserUploadS3Cached } from '$/services/userOS';

async function updateStaleSources(
  where: Prisma.SourceFileWhereInput,
  postState: SourceFileState,
  postSourceState: SourceState,
  timestamp: number
): Promise<void> {
  await client.sourceFile.updateMany({
    where,
    data: {
      state: postState,
      entityExists: false,
      updatedAt: timestamp,
    },
  });

  const updatedFiles = await client.sourceFile.findMany({
    where: {
      state: postState,
      updatedAt: timestamp,
    },
  });

  await client.source.updateMany({
    where: {
      id: {
        in: Array.from(new Set(updatedFiles.map((f) => f.sourceId))),
      },
    },
    data: {
      state: postSourceState,
      updatedAt: timestamp,
    },
  });

  for (const sourceFile of updatedFiles) {
    const os = getSourceFileOS(sourceFile.region as OSRegion);
    const key = getSourceFileKey(sourceFile.userId, sourceFile.id);
    const s3 = createUserUploadS3Cached(os);

    await retryS3NoReject(() =>
      s3.deleteObject({
        Bucket: os.bucket,
        Key: key,
      })
    );
  }
}

export async function cleanupStaleUploads() {
  const timestamp = Date.now();
  const staleCreatedAt =
    timestamp - SOURCE_FILE_TREAT_AS_NOT_UPLOADED_AFTER_CREATE;

  await updateStaleSources(
    {
      state: is<SourceFileState>('uploading'),
      createdAt: {
        lt: staleCreatedAt,
      },
    },
    'not_uploaded',
    'not_uploaded',
    timestamp
  );
}

export async function cleanupStaleTranscodes() {
  const timestamp = Date.now();
  const staleUploadedAt =
    timestamp - SOURCE_FILE_TREAT_AS_NOT_TRANSCODED_AFTER_UPLOAD;

  await updateStaleSources(
    {
      state: {
        in: [
          is<SourceFileState>('uploaded'),
          is<SourceFileState>('transcoding'),
        ],
      },
      uploadedAt: {
        lt: staleUploadedAt,
      },
    },
    'not_transcoded',
    'not_transcoded',
    timestamp
  );
}
