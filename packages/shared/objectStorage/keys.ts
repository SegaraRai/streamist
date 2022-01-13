export function getSourceFileKey(
  userId: string,
  sourceId: string,
  sourceFileId: string
): string {
  return `src/${userId}/${sourceId}/${sourceFileId}`;
}

export function getTranscodedAudioFileKey(
  userId: string,
  trackId: string,
  trackFileId: string,
  extension: string
): string {
  return `tra/${userId}/${trackId}/${trackFileId}${extension}`;
}

export function getTranscodedImageFileKey(
  userId: string,
  imageId: string,
  imageFileId: string,
  extension: string
): string {
  return `tri/${userId}/${imageId}/${imageFileId}${extension}`;
}

export function getTranscodeLogFileKey(
  userId: string,
  sourceId: string,
  sourceFileId: string,
  type: string,
  extension = '.json'
): string {
  return `trx/${userId}/${sourceId}/${sourceFileId}/${type}${extension}`;
}
