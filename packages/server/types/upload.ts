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
