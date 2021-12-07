import type { Region } from '$shared/regions.js';

export type AuthHeader = {
  authorization: string;
};

export type UserInfo = {
  id: string;
  name: string;
  icon: string;
};

export interface UploadURLPart {
  url: string;
  size: number;
}

export interface UploadURLMultipart {
  url: null;
  size: number;
  parts: UploadURLPart[];
}

export interface UploadURLNoMultipart {
  url: string;
  size: number;
  parts: null;
}

export type UploadURL = UploadURLMultipart | UploadURLNoMultipart;

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
  albumId: string;
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
