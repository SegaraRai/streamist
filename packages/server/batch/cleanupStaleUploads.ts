import type { Prisma } from '@prisma/client';
import {
  SOURCE_FILE_TREAT_AS_NOT_TRANSCODED_AFTER_UPLOAD,
  SOURCE_FILE_TREAT_AS_NOT_UPLOADED_AFTER_CREATE,
} from '$shared/config/sourceFile';
import { is } from '$shared/is';
import type { SourceFileState, SourceState } from '$shared/types/db';
import { client } from '$/db/lib/client';
import { osDeleteSourceFiles } from '$/os/sourceFile';

async function updateStaleSources(
  where: Prisma.SourceWhereInput,
  postState: SourceFileState & SourceState,
  timestamp: number
): Promise<void> {
  await client.source.updateMany({
    where,
    data: {
      state: postState,
      updatedAt: timestamp,
    },
  });

  const updatedSources = await client.source.findMany({
    where: {
      state: postState,
      updatedAt: timestamp,
    },
    select: {
      files: {
        select: {
          id: true,
          region: true,
          userId: true,
          sourceId: true,
          entityExists: true,
        },
      },
    },
  });

  const sourceFiles = updatedSources.flatMap((s) => s.files);

  await client.sourceFile.updateMany({
    where: {
      id: {
        in: sourceFiles.map((f) => f.id),
      },
    },
    data: {
      state: postState,
      entityExists: false,
      updatedAt: timestamp,
    },
  });

  await osDeleteSourceFiles(sourceFiles);
}

export async function cleanupStaleUploads(): Promise<void> {
  const timestamp = Date.now();
  const staleCreatedAt =
    timestamp - SOURCE_FILE_TREAT_AS_NOT_UPLOADED_AFTER_CREATE;

  await updateStaleSources(
    {
      state: is<SourceState>('uploading'),
      createdAt: {
        lt: staleCreatedAt,
      },
    },
    'not_uploaded',
    timestamp
  );
}

export async function cleanupStaleTranscodes(): Promise<void> {
  const timestamp = Date.now();
  const staleUploadedAt =
    timestamp - SOURCE_FILE_TREAT_AS_NOT_TRANSCODED_AFTER_UPLOAD;

  await updateStaleSources(
    {
      OR: [
        {
          state: {
            in: is<SourceState>('uploaded'),
          },
          updatedAt: {
            lt: staleUploadedAt,
          },
        },
        {
          state: {
            in: is<SourceFileState>('transcoding'),
          },
          transcodeStartedAt: {
            lt: staleUploadedAt,
          },
        },
      ],
    },
    'not_transcoded',
    timestamp
  );
}
