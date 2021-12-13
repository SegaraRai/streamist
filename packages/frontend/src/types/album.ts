import type { ResourceAlbum, ResourceImage } from '$/types';

export interface AlbumWithImage extends ResourceAlbum {
  images: ResourceImage[];
}
