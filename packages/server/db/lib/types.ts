import type { PrismaClient } from '$prisma/client';

export type TransactionalPrismaClient = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

export type SourceState =
  // the source and files are registered to database
  // the server can issue presigned upload URL only on this state
  | 'initial'
  // the files are uploaded to S3 by the user, and are being processed by the transcoder
  // staled sources (i.e. 'uploaded' state for a long time) will be removed from the database
  | 'uploaded'
  // the files are successfully transcoded (final state)
  | 'transcoding'
  // the files are successfully transcoded (final state)
  | 'transcoded'
  // the transcoder failed to process the files (final state)
  // the files will be removed from the database and S3 later
  | 'failed';

export type SourceFileType = 'audio' | 'cueSheet' | 'image';

export function toSourceFileType(sourceFileType: string): SourceFileType {
  switch (sourceFileType) {
    case 'audio':
    case 'cueSheet':
    case 'image':
      return sourceFileType;
  }

  throw new Error(`Invalid sourceFileType: ${sourceFileType}`);
}
