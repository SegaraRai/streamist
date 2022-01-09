export function getSourceFileKey(userId: string, fileId: string): string {
  return `src/${userId}/${fileId}`;
}

export function getTranscodedAudioFileKey(
  userId: string,
  fileId: string,
  extension: string
): string {
  return `tra/${userId}/${fileId}${extension}`;
}

export function getTranscodedImageFileKey(
  userId: string,
  fileId: string,
  extension: string
): string {
  return `tri/${userId}/${fileId}${extension}`;
}

export function getTranscodeLogFileKey(
  userId: string,
  sourceFileId: string,
  type: string,
  extension = '.json'
): string {
  return `trx/${userId}/${sourceFileId}/${type}${extension}`;
}
