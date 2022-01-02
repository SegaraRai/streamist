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
  Track,
  TrackCoArtist,
  TrackFile,
  User,
} from '$prisma/client';

export interface ResourceAlbum extends Readonly<Album> {
  readonly imageIds: readonly string[];
}

export interface ResourceAlbumCoArtist extends Readonly<AlbumCoArtist> {}

export interface ResourceArtist extends Readonly<Artist> {
  readonly imageIds: readonly string[];
}

export interface ResourceImage extends Readonly<Image> {
  readonly files: readonly Readonly<ImageFile>[];
}

export interface ResourcePlaylist extends Readonly<Playlist> {
  readonly imageIds: readonly string[];
  readonly trackIds: readonly string[];
}

export interface ResourceSource extends Readonly<Source> {}

// sourceFileId単体で索引できるようにするためにSourceの中に入れない
export interface ResourceSourceFile extends Readonly<SourceFile> {}

export interface ResourceTrack extends Readonly<Track> {
  readonly files: readonly Readonly<TrackFile>[];
}

export interface ResourceTrackCoArtist extends Readonly<TrackCoArtist> {}

export interface ResourceUser extends Omit<Readonly<User>, ''> {}

export type ResourceDeletion = Omit<Readonly<Deletion>, 'entityType'> & {
  readonly entityType: DeletionEntityType;
};

export interface ResourcesUpdated {
  readonly updated: true;
  readonly timestamp: number;
  readonly updatedAt: number;
  readonly user: ResourceUser;
  readonly albumCoArtists: readonly ResourceAlbumCoArtist[];
  readonly albums: readonly ResourceAlbum[];
  readonly artists: readonly ResourceArtist[];
  readonly images: readonly ResourceImage[];
  readonly playlists: readonly ResourcePlaylist[];
  readonly sourceFiles: readonly ResourceSourceFile[];
  readonly sources: readonly ResourceSource[];
  readonly trackCoArtists: readonly ResourceTrackCoArtist[];
  readonly tracks: readonly ResourceTrack[];
  readonly deletions: readonly ResourceDeletion[];
}

export interface ResourcesNotUpdated {
  readonly updated: false;
  readonly timestamp: number;
  readonly updatedAt: number;
}
