import type { CoArtistRole } from '$shared/coArtist';
import type { OSRegion } from '$shared/objectStorage';
import type {
  DeletionEntityType,
  SourceFileAttachToType,
  SourceFileState,
  SourceFileType,
  SourceState,
} from '$shared/types';
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

export interface ResourceAlbum
  extends Readonly<Omit<Album, 'imageOrder' | 'userId'>> {
  readonly imageIds: readonly string[];
}

export interface ResourceAlbumCoArtist
  extends Readonly<Omit<AlbumCoArtist, 'userId'>> {
  readonly role: CoArtistRole;
}

export interface ResourceArtist
  extends Readonly<Omit<Artist, 'imageOrder' | 'userId'>> {
  readonly imageIds: readonly string[];
}

interface ResourceImageFile
  extends Readonly<Omit<ImageFile, 'imageId' | 'userId'>> {
  readonly region: OSRegion;
}

export interface ResourceImage extends Readonly<Omit<Image, 'userId'>> {
  readonly files: readonly ResourceImageFile[];
}

export interface ResourcePlaylist
  extends Readonly<Omit<Playlist, 'imageOrder' | 'trackOrder' | 'userId'>> {
  readonly imageIds: readonly string[];
  readonly trackIds: readonly string[];
}

export interface ResourceSource extends Readonly<Omit<Source, 'userId'>> {
  readonly state: SourceState;
}

// sourceFileId単体で索引できるようにするためにSourceの中に入れない
export interface ResourceSourceFile
  extends Readonly<Omit<SourceFile, 'userId'>> {
  readonly attachToType: SourceFileAttachToType | null;
  readonly region: OSRegion;
  readonly state: SourceFileState;
  readonly type: SourceFileType;
}

interface ResourceTrackFile
  extends Readonly<Omit<TrackFile, 'trackId' | 'userId'>> {
  readonly region: OSRegion;
}

export interface ResourceTrack extends Readonly<Omit<Track, 'userId'>> {
  readonly files: readonly ResourceTrackFile[];
}

export interface ResourceTrackCoArtist
  extends Readonly<Omit<TrackCoArtist, 'userId'>> {
  readonly role: CoArtistRole;
}

export interface ResourceDeletion
  extends Readonly<Omit<Deletion, 'entityType' | 'userId'>> {
  readonly entityType: DeletionEntityType;
}

export interface ResourceUser extends Readonly<User> {}

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
