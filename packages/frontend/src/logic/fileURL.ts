import api from '@/logic/api';

export function getTrackFileURL(
  trackId: string,
  trackFileId: string
): Promise<string> {
  return api.my.tracks._trackId(trackId).files._fileId(trackFileId).url.$get();
}

export function getImageFileURL(
  imageId: string,
  imageFileId: string
): Promise<string> {
  return api.my.images._imageId(imageId).files._fileId(imageFileId).url.$get();
}
