export interface UploadURLPart {
  url: string;
  size: number;
}
export interface UploadURL {
  size: number;
  parts: UploadURLPart[];
}
