// import { client } from '$/db/lib/client';
// import { dbTrackCount } from '$/db/track';
// import { HTTPError } from '$/utils/httpError';
// import { generateSourceFileId, generateSourceId } from '$/utils/id';

export type UploadFileType = 'image' | 'audio';

export interface UploadAudioFile {
  readonly fileName: string;
  readonly fileSize: number;
  readonly fileType: 'audio';
}

export interface UploadImageFile {
  readonly fileName: string;
  readonly fileSize: number;
  readonly fileType: 'image';
  readonly albumId: string;
}

export interface UploadResultFile {
  readonly presignedURL: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly sourceFileId: string;
}

export interface UploadResult {
  readonly sourceId: string;
  readonly files: readonly UploadResultFile[];
}

/*
export async function uploadAudio(
  userId: string,
  files: readonly UploadAudioFile[]
): Promise<UploadResult> {
  // TODO(prod): check number of tracks
  if ((await dbTrackCount(userId)) >= 100) {
    throw new HTTPError(403, 'Too many tracks');
  }

  const sourceId = await generateSourceId();

  const resultFiles: UploadResultFile[] = [];
  for (const file of files) {
    resultFiles.push({
      presignedURL: '',
      fileName: file.fileName,
      fileSize: file.fileSize,
      sourceFileId: await generateSourceFileId(),
    });
  }

  // register to database

  client.

  return {
    sourceId,
    files: resultFiles,
  };
}

// */
