import type { ResourceAlbum } from '$/types';
import type { ImageWithFile } from './image';

export interface AlbumWithImageFile extends ResourceAlbum {
  images: ImageWithFile[];
}
