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

export interface ResourceAlbum
  extends Readonly<Omit<BigIntToNumber<Album>, 'imageOrder' | 'userId'>> {
  readonly imageIds: readonly string[];
}

export interface ResourceAlbumCoArtist
  extends Readonly<Omit<BigIntToNumber<AlbumCoArtist>, 'userId'>> {
  readonly role: CoArtistRole;
}

export interface ResourceArtist
  extends Readonly<Omit<BigIntToNumber<Artist>, 'imageOrder' | 'userId'>> {
  readonly imageIds: readonly string[];
}

interface ResourceImageFile
  extends Readonly<Omit<BigIntToNumber<ImageFile>, 'imageId' | 'userId'>> {
  readonly region: OSRegion;
}

export interface ResourceImage
  extends Readonly<Omit<BigIntToNumber<Image>, 'userId'>> {
  readonly files: readonly ResourceImageFile[];
}

export type ResourceImageSimple = Omit<ResourceImage, 'files'>;

export interface ResourcePlaylist
  extends Readonly<
    Omit<BigIntToNumber<Playlist>, 'imageOrder' | 'trackOrder' | 'userId'>
  > {
  readonly imageIds: readonly string[];
  readonly trackIds: readonly string[];
}

export interface ResourceSource
  extends Readonly<Omit<BigIntToNumber<Source>, 'userId'>> {
  readonly state: SourceState;
}

// sourceFileId単体で索引できるようにするためにSourceの中に入れない
export interface ResourceSourceFile
  extends Readonly<Omit<BigIntToNumber<SourceFile>, 'userId'>> {
  readonly attachToType: SourceFileAttachToType | null;
  readonly region: OSRegion;
  readonly state: SourceFileState;
  readonly type: SourceFileType;
}

interface ResourceTrackFile
  extends Readonly<Omit<BigIntToNumber<TrackFile>, 'trackId' | 'userId'>> {
  readonly region: OSRegion;
}

export interface ResourceTrack
  extends Readonly<Omit<BigIntToNumber<Track>, 'userId'>> {
  readonly files: readonly ResourceTrackFile[];
}

export type ResourceTrackSimple = Omit<ResourceTrack, 'files'>;

export interface ResourceTrackCoArtist
  extends Readonly<Omit<BigIntToNumber<TrackCoArtist>, 'userId'>> {
  readonly role: CoArtistRole;
}

export interface ResourceDeletion
  extends Readonly<Omit<BigIntToNumber<Deletion>, 'entityType' | 'userId'>> {
  readonly entityType: DeletionEntityType;
}

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
