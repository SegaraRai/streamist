export type SourceState =
  // the source and files are registered to database
  // multipart upload id is assigned by S3 for large files
  // the server can issue presigned upload URL only on this state
  | 'uploading'
  // the files are uploaded to S3 by the user, and are being processed by the transcoder
  // staled sources (i.e. 'uploaded' state for a long time) will be removed from the database
  | 'uploaded'
  // the files are being transcoded by the transcoder
  | 'transcoding'
  // the files are successfully transcoded (final state)
  | 'transcoded'
  // the files are not uploaded by the user (final state)
  | 'not_uploaded'
  // the files are passed to the transcoder but the transcoder does not respond
  | 'not_transcoded'
  // the transcoder failed to process the files (final state)
  // the files will be removed from the database and S3 later
  | 'failed';

export type SourceFileType = 'audio' | 'cueSheet' | 'image';

export type SourceFileAttachToType = 'album';

export function toSourceFileType(sourceFileType: string): SourceFileType {
  switch (sourceFileType) {
    case 'audio':
    case 'cueSheet':
    case 'image':
      return sourceFileType;
  }

  throw new TypeError(`invalid sourceFileType: ${sourceFileType}`);
}

export function toSourceFileAttachToType(
  sourceFileAttachToType: string
): SourceFileAttachToType {
  switch (sourceFileAttachToType) {
    case 'album':
      return sourceFileAttachToType;
  }

  throw new TypeError(
    `invalid sourceFileAttachToType: ${sourceFileAttachToType}`
  );
}
