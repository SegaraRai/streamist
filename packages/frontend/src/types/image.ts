import type { Image, ImageFile } from '$prisma/client';

export interface ImageWithFile extends Image {
  files: ImageFile[];
}
