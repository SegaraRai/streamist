export type SourceState =
  // the source and files are registered to database
  // multipart upload id is assigned by S3 for large files
  // the server can issue presigned upload URL only on this state
  | 'uploading'
  // the files are uploaded to S3 by the user, and are being processed by the transcoder
  // staled sources (i.e. 'uploaded' state for a long time) will be removed from the database
  | 'uploaded'
  // the files are being processed by the transcoder
  | 'transcoding'
  // [final state] the files are successfully transcoded
  // some files may be skipped due to transcoding error
  | 'transcoded'
  // [final state] some files are not uploaded by the user
  // uploaded source files will be removed from S3
  | 'not_uploaded'
  // [final state] the files are passed to the transcoder but the transcoder does not respond
  // source files will be removed from S3
  | 'not_transcoded';

export type SourceFileState =
  // the file is registered to database
  // multipart upload id is assigned by S3 for large files
  // the server can issue presigned upload URL only on this state
  | 'uploading'
  // the file is uploaded to S3 by the user, and is being processed by the transcoder
  // staled sources (i.e. 'uploaded' state for a long time) will be removed from the database
  | 'uploaded'
  // the file is being processed by the transcoder
  | 'transcoding'
  // [final state] the file is successfully transcoded
  // changed at the same time as SourceState
  // extracted images are registered to database with this state
  | 'transcoded'
  // [final state] the file is not uploaded by the user
  // changed at the same time as SourceState
  | 'not_uploaded'
  // [final state] the file is passed to the transcoder but the transcoder does not respond
  // changed at the same time as SourceState
  // the source file will be removed from S3
  | 'not_transcoded'
  // [final state] the transcoder failed to process the file
  // transcoded files are removed from S3 by the transcoder, and the source file will be removed from S3 by the server
  | 'failed';

export type SourceFileType = 'audio' | 'cueSheet' | 'image';

export type SourceFileAttachToType = 'album';

export type DeletionEntityType =
  | 'albumCoArtist'
  | 'album'
  | 'artist'
  | 'image'
  | 'playlist'
  | 'sourceFile'
  | 'source'
  | 'tag'
  | 'trackCoArtist'
  | 'track';

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
