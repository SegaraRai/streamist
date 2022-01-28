import type { Prisma } from '@prisma/client';
import {
  SOURCE_FILE_TREAT_AS_NOT_TRANSCODED_AFTER_UPLOAD,
  SOURCE_FILE_TREAT_AS_NOT_UPLOADED_AFTER_CREATE,
} from '$shared/config';
import { is } from '$shared/is';
import type { SourceFileState, SourceState } from '$shared/types';
import { client } from '$/db/lib/client';
import { dbGetTimestamp } from '$/db/lib/timestamp';
import { osDeleteSourceFiles } from '$/os/sourceFile';

async function updateStaleSources(
  where: Prisma.SourceWhereInput,
  postState: SourceFileState & SourceState
): Promise<void> {
  const sources = await client.source.findMany({
    where,
    select: {
      id: true,
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

  await client.source.updateMany({
    where: {
      id: {
        in: sources.map((s) => s.id),
      },
    },
    data: {
      state: postState,
      updatedAt: dbGetTimestamp(),
    },
  });

  const sourceFiles = sources.flatMap((s) => s.files);

  await client.sourceFile.updateMany({
    where: {
      id: {
        in: sourceFiles.map((f) => f.id),
      },
    },
    data: {
      state: postState,
      entityExists: false,
      updatedAt: dbGetTimestamp(),
    },
  });

  await osDeleteSourceFiles(sourceFiles);
}

export async function cleanupStaleUploads(): Promise<void> {
  const staleCreatedAt =
    dbGetTimestamp() - BigInt(SOURCE_FILE_TREAT_AS_NOT_UPLOADED_AFTER_CREATE);

  await updateStaleSources(
    {
      state: is<SourceState>('uploading'),
      createdAt: {
        lt: staleCreatedAt,
      },
    },
    'not_uploaded'
  );
}

export async function cleanupStaleTranscodes(): Promise<void> {
  const staleUploadedAt =
    dbGetTimestamp() - BigInt(SOURCE_FILE_TREAT_AS_NOT_TRANSCODED_AFTER_UPLOAD);

  await updateStaleSources(
    {
      OR: [
        {
          state: is<SourceState>('uploaded'),
          updatedAt: {
            lt: staleUploadedAt,
          },
        },
        {
          state: is<SourceFileState>('transcoding'),
          transcodeStartedAt: {
            lt: staleUploadedAt,
          },
        },
      ],
    },
    'not_transcoded'
  );
}
