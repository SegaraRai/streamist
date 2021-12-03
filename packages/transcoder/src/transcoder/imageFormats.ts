import { filterFalsy } from '$shared/filter';
import type { ImageMagickImage, ImageMagickResult } from '../types/imageMagick';

export interface ImageFormat {
  /** フォーマットのID */
  readonly name: string;
  /** 用いる形式（jpegなど） */
  readonly format: string;
  /** ピリオド付きの拡張子 */
  readonly extension: string;
  /** MIMEタイプ */
  readonly mimeType: string;
  /** JPEGの品質 */
  readonly quality: number;
  /** 最大幅（px） */
  readonly maxWidth: number;
  /** 最大高さ（px） */
  readonly maxHeight: number;
}

type GetImageFormat = (
  imageMagickResult: ImageMagickResult,
  imageInfo: ImageMagickImage
) => ImageFormat | undefined;

export const transcodeImageFormats: GetImageFormat[] = [
  (
    _imageMagickResult: ImageMagickResult,
    _imageInfo: ImageMagickImage
  ): ImageFormat => ({
    name: 'v1-jpeg-240',
    format: 'jpg',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    quality: 90,
    maxWidth: 240,
    maxHeight: 240,
  }),
  (
    _imageMagickResult: ImageMagickResult,
    _imageInfo: ImageMagickImage
  ): ImageFormat => ({
    name: 'v1-jpeg-720',
    format: 'jpg',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    quality: 90,
    maxWidth: 720,
    maxHeight: 720,
  }),
  (
    _imageMagickResult: ImageMagickResult,
    _imageInfo: ImageMagickImage
  ): ImageFormat => ({
    name: 'v1-jpeg-2400',
    format: 'jpg',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    quality: 90,
    maxWidth: 2400,
    maxHeight: 2400,
  }),
  (
    _imageMagickResult: ImageMagickResult,
    _imageInfo: ImageMagickImage
  ): ImageFormat => ({
    name: 'v1-jpeg-4200',
    format: 'jpg',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    quality: 90,
    maxWidth: 4200,
    maxHeight: 4200,
  }),
];

export function getTranscodeImageFormats(
  imageMagickResult: ImageMagickResult,
  imageInfo: ImageMagickImage
): ImageFormat[] {
  return filterFalsy(
    transcodeImageFormats.map((func) => func(imageMagickResult, imageInfo))
  );
}
