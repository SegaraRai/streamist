import type { AlbumImage, Image, ImageFile } from '$prisma/client';

export interface ImageWithFile extends Image {
  files: ImageFile[];
}

export interface AlbumImageWithImageFile extends AlbumImage {
  image: ImageWithFile;
}

export interface AlbumImageWithImage extends AlbumImage {
  image: Image;
}
