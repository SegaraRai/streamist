import type { CoArtistRole } from '$shared/coArtist';
import type { Plan } from '$shared/config';
import { dbArrayDeserializeItemIds } from '$shared/dbArray';
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
import type {
  ResourceAlbum,
  ResourceAlbumCoArtist,
  ResourceArtist,
  ResourceDeletion,
  ResourceImage,
  ResourceImageSimple,
  ResourcePlaylist,
  ResourceSource,
  ResourceSourceFile,
  ResourceTrack,
  ResourceTrackCoArtist,
  ResourceTrackSimple,
  ResourceUser,
} from '$/types';

function toNumber<T = never>(value: T | bigint): T | number {
  return typeof value === 'bigint' ? Number(value) : value;
}

export function convertAlbum(album: Album): ResourceAlbum {
  return {
    ...album,
    createdAt: toNumber<never>(album.createdAt),
    updatedAt: toNumber<never>(album.updatedAt),
    imageIds: dbArrayDeserializeItemIds(album.imageOrder),
    imageOrder: undefined,
    userId: undefined,
  };
}

export function convertAlbumCoArtist(
  albumCoArtist: AlbumCoArtist
): ResourceAlbumCoArtist {
  return {
    ...albumCoArtist,
    role: albumCoArtist.role as CoArtistRole,
    createdAt: toNumber<never>(albumCoArtist.createdAt),
    updatedAt: toNumber<never>(albumCoArtist.updatedAt),
    userId: undefined,
  };
}

export function convertArtist(artist: Artist): ResourceArtist {
  return {
    ...artist,
    createdAt: toNumber<never>(artist.createdAt),
    updatedAt: toNumber<never>(artist.updatedAt),
    imageIds: dbArrayDeserializeItemIds(artist.imageOrder),
    imageOrder: undefined,
    userId: undefined,
  };
}

export function convertImageSimple(image: Image): ResourceImageSimple {
  return {
    ...image,
    createdAt: toNumber<never>(image.createdAt),
    updatedAt: toNumber<never>(image.updatedAt),
    userId: undefined,
  };
}

export function convertImage(
  image: Image & { files: ImageFile[] }
): ResourceImage {
  return {
    ...convertImageSimple(image),
    files: image.files.map((file) => ({
      ...file,
      region: file.region as OSRegion,
      createdAt: toNumber<never>(file.createdAt),
      updatedAt: toNumber<never>(file.updatedAt),
      imageId: undefined,
      userId: undefined,
    })),
  };
}

export function convertPlaylist(playlist: Playlist): ResourcePlaylist {
  return {
    ...playlist,
    createdAt: toNumber<never>(playlist.createdAt),
    updatedAt: toNumber<never>(playlist.updatedAt),
    imageIds: dbArrayDeserializeItemIds(playlist.imageOrder),
    trackIds: dbArrayDeserializeItemIds(playlist.trackOrder),
    imageOrder: undefined,
    trackOrder: undefined,
    userId: undefined,
  };
}

export function convertTrackSimple(track: Track): ResourceTrackSimple {
  return {
    ...track,
    createdAt: toNumber<never>(track.createdAt),
    updatedAt: toNumber<never>(track.updatedAt),
    userId: undefined,
  };
}

export function convertTrack(
  track: Track & { files: TrackFile[] }
): ResourceTrack {
  return {
    ...convertTrackSimple(track),
    files: track.files.map((file) => ({
      ...file,
      region: file.region as OSRegion,
      createdAt: toNumber<never>(file.createdAt),
      updatedAt: toNumber<never>(file.updatedAt),
      trackId: undefined,
      userId: undefined,
    })),
  };
}

export function convertSource(source: Source): ResourceSource {
  return {
    ...source,
    state: source.state as SourceState,
    createdAt: toNumber<never>(source.createdAt),
    updatedAt: toNumber<never>(source.updatedAt),
    transcodeFinishedAt: toNumber<null>(source.transcodeFinishedAt),
    transcodeStartedAt: toNumber<null>(source.transcodeStartedAt),
    userId: undefined,
  };
}

export function convertSourceFile(sourceFile: SourceFile): ResourceSourceFile {
  return {
    ...sourceFile,
    attachToType: sourceFile.attachToType as SourceFileAttachToType | null,
    region: sourceFile.region as OSRegion,
    state: sourceFile.state as SourceFileState,
    type: sourceFile.type as SourceFileType,
    createdAt: toNumber<never>(sourceFile.createdAt),
    updatedAt: toNumber<never>(sourceFile.updatedAt),
    uploadedAt: toNumber<null>(sourceFile.uploadedAt),
    userId: undefined,
  };
}

export function convertTrackCoArtist(
  trackCoArtist: TrackCoArtist
): ResourceTrackCoArtist {
  return {
    ...trackCoArtist,
    role: trackCoArtist.role as CoArtistRole,
    createdAt: toNumber<never>(trackCoArtist.createdAt),
    updatedAt: toNumber<never>(trackCoArtist.updatedAt),
    userId: undefined,
  };
}

export function convertDeletion(deletion: Deletion): ResourceDeletion {
  return {
    ...deletion,
    entityType: deletion.entityType as DeletionEntityType,
    deletedAt: toNumber<never>(deletion.deletedAt),
    userId: undefined,
  };
}

export function convertUser(user: User): ResourceUser {
  // since user has very sensitive information such as passwords, we explicitly include required fields only
  return {
    id: user.id,
    displayName: user.displayName,
    region: user.region as OSRegion,
    plan: user.plan as Plan,
    maxTrackId: user.maxTrackId,
    createdAt: toNumber<never>(user.createdAt),
    updatedAt: toNumber<never>(user.updatedAt),
  };
}
