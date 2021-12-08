import type { Album, Image, ImageFile } from '$prisma/client';

export interface ImageWithFile extends Image {
  files: ImageFile[];
}

export interface AlbumWithImageFile extends Album {
  images: ImageWithFile[];
}

export interface AlbumWithImage extends Album {
  images: Image[];
}
