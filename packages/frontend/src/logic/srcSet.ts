import type { ImageFile } from '$prisma/client';
import { getImageFileURL } from './fileURL';

export interface SrcObject {
  src$$q: string;
  srcSet$$q: string;
}

/**
 * `ImageFileDTO`の配列から要求された大きさに合う`SrcObject`を返す \
 * `src`に指定されるのは、要求された大きさ以上で最小のものか、それがなければ指定された画像のうち一番大きいものとなる
 * @param imageFiles 使用できる`ImageFileDTO`の配列
 * @param targetSize 必要な大きさ（px）
 * @returns `SrcObject`または`undefined`（`ImageFileDTO`の配列の大きさが0のとき）
 */
export function createSrc(
  imageFiles: readonly Readonly<ImageFile>[],
  targetSize: number
): SrcObject | undefined {
  if (imageFiles.length === 0) {
    return undefined;
  }

  const imageFileWithURLs = imageFiles.map((imageFile) => ({
    ...imageFile,
    url: getImageFileURL(imageFile),
  }));

  // 小さい順
  const sortedImages = [...imageFileWithURLs].sort((a, b) => a.width - b.width);

  const defaultImage =
    sortedImages.filter(
      (image) => Math.min(image.width, image.height) >= targetSize
    )[0] || sortedImages[sortedImages.length - 1];

  const src = defaultImage.url;

  const srcSet = sortedImages
    .map((imageFile) => `${imageFile.url} ${imageFile.width}w`)
    .join(', ');

  return {
    src$$q: src,
    srcSet$$q: srcSet,
  };
}
