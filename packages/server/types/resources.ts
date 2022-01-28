import type { CoArtistRole } from '$shared/coArtist';
import type { Plan } from '$shared/config';
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

type BigIntToNumberValue<T, U = never> = T extends bigint | U
  ? number | Exclude<U, bigint>
  : T;

type BigIntToNumber<T> = {
  [P in keyof T]: BigIntToNumberValue<T[P]>;
};

type UndefinableOmit<T, K extends string | number | symbol> = Omit<T, K> & {
  [P in K]?: undefined;
};

type TransformAndOmit<T, K extends string> = Readonly<
  UndefinableOmit<BigIntToNumber<T>, K>
>;

export interface ResourceAlbum
  extends TransformAndOmit<Album, 'imageOrder' | 'userId'> {
  readonly imageIds: readonly string[];
}

export interface ResourceAlbumCoArtist
  extends TransformAndOmit<AlbumCoArtist, 'userId'> {
  readonly role: CoArtistRole;
}

export interface ResourceArtist
  extends TransformAndOmit<Artist, 'imageOrder' | 'userId'> {
  readonly imageIds: readonly string[];
}

interface ResourceImageFile
  extends TransformAndOmit<ImageFile, 'imageId' | 'userId'> {
  readonly region: OSRegion;
}

export interface ResourceImage extends TransformAndOmit<Image, 'userId'> {
  readonly files: readonly ResourceImageFile[];
}

export type ResourceImageSimple = Omit<ResourceImage, 'files'>;

export interface ResourcePlaylist
  extends Readonly<
    TransformAndOmit<Playlist, 'imageOrder' | 'trackOrder' | 'userId'>
  > {
  readonly imageIds: readonly string[];
  readonly trackIds: readonly string[];
}

export interface ResourceSource extends TransformAndOmit<Source, 'userId'> {
  readonly state: SourceState;
}

// sourceFileId単体で索引できるようにするためにSourceの中に入れない
export interface ResourceSourceFile
  extends TransformAndOmit<SourceFile, 'userId'> {
  readonly attachToType: SourceFileAttachToType | null;
  readonly region: OSRegion;
  readonly state: SourceFileState;
  readonly type: SourceFileType;
}

interface ResourceTrackFile
  extends TransformAndOmit<TrackFile, 'trackId' | 'userId'> {
  readonly region: OSRegion;
}

export interface ResourceTrack extends TransformAndOmit<Track, 'userId'> {
  readonly files: readonly ResourceTrackFile[];
}

export type ResourceTrackSimple = Omit<ResourceTrack, 'files'>;

export interface ResourceTrackCoArtist
  extends TransformAndOmit<TrackCoArtist, 'userId'> {
  readonly role: CoArtistRole;
}

export interface ResourceDeletion extends TransformAndOmit<Deletion, 'userId'> {
  readonly entityType: DeletionEntityType;
}

// NOTE: this uses Pick, not Omit
export interface ResourceUser
  extends Readonly<
    Pick<
      BigIntToNumber<User>,
      | 'id'
      | 'displayName'
      | 'region'
      | 'plan'
      | 'maxTrackId'
      | 'createdAt'
      | 'updatedAt'
    >
  > {
  readonly region: OSRegion;
  readonly plan: Plan;
}

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
