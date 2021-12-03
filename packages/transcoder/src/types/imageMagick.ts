// ImageMagick型定義

export interface ImageMagickGeometry {
  width: number;
  height: number;
  x: number;
  y: number;
}

export type ImageMagickProperties = Record<string, string>;

export interface ImageMagickImage {
  name: string;
  baseName: string;
  format: string;
  formatDescription: string;
  mimeType: string;
  class: string;
  geometry: ImageMagickGeometry;
  units: string;
  type: string;
  baseType: string;
  endianess: string;
  colorspace: string;
  depth: number;
  baseDepth: number;
  pixels: number;
  renderingIntent: string;
  gamma: number;
  matteColor: string;
  backgroundColor: string;
  borderColor: string;
  transparentColor: string;
  interlace: string;
  intensity: string;
  compose: string;
  pageGeometry: ImageMagickGeometry;
  dispose: string;
  iterations: number;
  compression: string;
  orientation: string;
  properties: ImageMagickProperties;
  tainted: boolean;
  filesize: string;
  numberPixels: string;
  pixelsPerSecond: string;
  userTime: string;
  elapsedTime: string;
  version: string;
}

export interface ImageMagickObject {
  image?: ImageMagickImage;
}

export type ImageMagickResult = ImageMagickObject[];
