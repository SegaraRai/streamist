import type {
  ImageMagickImage,
  ImageMagickResult,
} from '../types/imageMagick.js';
import { filterFalsy } from '$shared/filter.js';

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
    name: 'v1-jpeg-160',
    format: 'jpg',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    quality: 90,
    maxWidth: 160,
    maxHeight: 160,
  }),
  (
    _imageMagickResult: ImageMagickResult,
    _imageInfo: ImageMagickImage
  ): ImageFormat => ({
    name: 'v1-jpeg-480',
    format: 'jpg',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    quality: 90,
    maxWidth: 480,
    maxHeight: 480,
  }),
  (
    _imageMagickResult: ImageMagickResult,
    _imageInfo: ImageMagickImage
  ): ImageFormat => ({
    name: 'v1-jpeg-1280',
    format: 'jpg',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    quality: 90,
    maxWidth: 1280,
    maxHeight: 1280,
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
