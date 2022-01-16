import type { OSRegion } from '$shared/objectStorage';
import type { SourceFileAttachToType } from '$shared/types';
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
  region: OSRegion;
  audioFile: CreateSourceRequestFileAudio;
  cueSheetFile: CreateSourceRequestFileCueSheet | null;
}

export interface CreateSourceRequestImage {
  type: 'image';
  region: OSRegion;
  attachToType: SourceFileAttachToType;
  attachToId: string;
  attachPrepend: boolean;
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
