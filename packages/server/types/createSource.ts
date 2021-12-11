import type { Region } from '$shared/regions';
import type { SourceFileAttachToType } from '$shared/types/db';
import type { UploadURL } from './upload';

export interface CreateSourceRequestFileAudio {
  type: 'audio';
  filename: string;
  fileSize: number;
}

export interface CreateSourceRequestFileCueSheet {
  type: 'cueSheet';
  filename: string;
  fileSize: number;
}

export interface CreateSourceRequestFileImage {
  type: 'image';
  filename: string;
  fileSize: number;
}

export interface CreateSourceRequestAudio {
  type: 'audio';
  region: Region;
  audioFile: CreateSourceRequestFileAudio;
  cueSheetFile: CreateSourceRequestFileCueSheet | null;
}

export interface CreateSourceRequestImage {
  type: 'image';
  region: Region;
  attachToType: SourceFileAttachToType;
  attachToId: string;
  imageFile: CreateSourceRequestFileImage;
}

export interface CreateSourceResponseFile {
  requestFile:
    | CreateSourceRequestFileAudio
    | CreateSourceRequestFileCueSheet
    | CreateSourceRequestFileImage;
  sourceFileId: string;
  uploadURL: UploadURL;
}

export interface CreateSourceResponse {
  sourceId: string;
  files: CreateSourceResponseFile[];
}
