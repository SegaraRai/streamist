import type { DeletionEntityType } from '$shared/types/db';
import type {
  Album,
  AlbumCoArtist,
  Artist,
  Deletion,
  Image,
  ImageFile,
  Playlist,
  Source,
  SourceFile,
  Tag,
  Track,
  TrackCoArtist,
  TrackFile,
  User,
} from '$prisma/client';

export interface ResourceAlbum extends Album {
  imageIds: string[];
}

export interface ResourceAlbumCoArtist extends AlbumCoArtist {}

export interface ResourceArtist extends Artist {
  imageIds: string[];
}

export interface ResourceImage extends Image {
  files: ImageFile[];
}

export interface ResourcePlaylist extends Playlist {
  imageIds: string[];
  trackIds: string[];
}

export interface ResourceSource extends Source {}

// sourceFileId単体で索引できるようにするためにSourceの中に入れない
export interface ResourceSourceFile extends SourceFile {}

export interface ResourceTag extends Tag {}

export interface ResourceTrack extends Track {
  files: TrackFile[];
}

export interface ResourceTrackCoArtist extends TrackCoArtist {}

export interface ResourceUser extends Omit<User, ''> {}

export type ResourceDeletion = Omit<Deletion, 'entityType'> & {
  entityType: DeletionEntityType;
};

export interface ResourcesUpdated {
  updated: true;
  timestamp: number;
  updatedAt: number;
  user: ResourceUser;
  albumCoArtists: ResourceAlbumCoArtist[];
  albums: ResourceAlbum[];
  artists: ResourceArtist[];
  images: ResourceImage[];
  playlists: ResourcePlaylist[];
  sourceFiles: ResourceSourceFile[];
  sources: ResourceSource[];
  tags: ResourceTag[];
  trackCoArtists: ResourceTrackCoArtist[];
  tracks: ResourceTrack[];
  deletions: ResourceDeletion[];
}

export interface ResourcesNotUpdated {
  updated: false;
  timestamp: number;
  updatedAt: number;
}
