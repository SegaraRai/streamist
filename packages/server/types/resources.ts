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

export type ResourceAlbumCoArtist = AlbumCoArtist;

export type ResourceArtist = Artist;

export interface ResourceImage extends Image {
  files: ImageFile[];
}

export interface ResourcePlaylist extends Playlist {
  trackIds: string[];
}

export type ResourceSource = Source;

// sourceFileId単体で索引できるようにするためにSourceの中に入れない
export type ResourceSourceFile = SourceFile;

export type ResourceTag = Tag;

export interface ResourceTrack extends Track {
  files: TrackFile[];
}

export type ResourceTrackCoArtist = TrackCoArtist;

export type ResourceUser = Omit<User, ''>;

export type ResourceDeletion = Omit<Deletion, 'entityType'> & {
  entityType: DeletionEntityType;
};

export interface Resources {
  timestamp: number;
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
