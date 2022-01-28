import type { Plan } from '$shared/config';
import { dbArrayDeserializeItemIds } from '$shared/dbArray';
import type { OSRegion } from '$shared/objectStorage';
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
import { RESOURCE_TIMESTAMP_MARGIN } from '$/config';
import { client } from '$/db/lib/client';
import { dbGetTimestamp } from '$/db/lib/timestamp';
import type {
  ResourceAlbum,
  ResourceAlbumCoArtist,
  ResourceArtist,
  ResourceDeletion,
  ResourceImage,
  ResourcePlaylist,
  ResourceSource,
  ResourceSourceFile,
  ResourceTrack,
  ResourceTrackCoArtist,
  ResourceUser,
  ResourcesNotUpdated,
  ResourcesUpdated,
} from '$/types';
import { HTTPError } from '$/utils/httpError';

function toNumber<T = never>(value: T | bigint): T | number {
  return typeof value === 'bigint' ? Number(value) : value;
}

function convertAlbum(album: Album): ResourceAlbum {
  return {
    ...album,
    createdAt: toNumber(album.createdAt),
    updatedAt: toNumber(album.updatedAt),
    imageIds: dbArrayDeserializeItemIds(album.imageOrder),
    imageOrder: undefined,
    userId: undefined,
  } as ResourceAlbum;
}

function convertAlbumCoArtist(
  albumCoArtist: AlbumCoArtist
): ResourceAlbumCoArtist {
  return {
    ...albumCoArtist,
    createdAt: toNumber(albumCoArtist.createdAt),
    updatedAt: toNumber(albumCoArtist.updatedAt),
    userId: undefined,
  } as ResourceAlbumCoArtist;
}

function convertArtist(artist: Artist): ResourceArtist {
  return {
    ...artist,
    createdAt: toNumber(artist.createdAt),
    updatedAt: toNumber(artist.updatedAt),
    imageIds: dbArrayDeserializeItemIds(artist.imageOrder),
    imageOrder: undefined,
    userId: undefined,
  } as ResourceArtist;
}

function convertImage(image: Image & { files: ImageFile[] }): ResourceImage {
  return {
    ...image,
    createdAt: toNumber(image.createdAt),
    updatedAt: toNumber(image.updatedAt),
    files: image.files.map((file) => ({
      ...file,
      createdAt: toNumber(file.createdAt),
      updatedAt: toNumber(file.updatedAt),
      imageId: undefined,
      userId: undefined,
    })),
    userId: undefined,
  } as ResourceImage;
}

function convertPlaylist(playlist: Playlist): ResourcePlaylist {
  return {
    ...playlist,
    createdAt: toNumber(playlist.createdAt),
    updatedAt: toNumber(playlist.updatedAt),
    imageIds: dbArrayDeserializeItemIds(playlist.imageOrder),
    trackIds: dbArrayDeserializeItemIds(playlist.trackOrder),
    imageOrder: undefined,
    trackOrder: undefined,
    userId: undefined,
  } as ResourcePlaylist;
}

function convertTrack(track: Track & { files: TrackFile[] }): ResourceTrack {
  return {
    ...track,
    createdAt: toNumber(track.createdAt),
    updatedAt: toNumber(track.updatedAt),
    files: track.files.map((file) => ({
      ...file,
      createdAt: toNumber(file.createdAt),
      updatedAt: toNumber(file.updatedAt),
      trackId: undefined,
      userId: undefined,
    })),
    userId: undefined,
  } as ResourceTrack;
}

function convertSource(source: Source): ResourceSource {
  return {
    ...source,
    createdAt: toNumber(source.createdAt),
    updatedAt: toNumber(source.updatedAt),
    transcodeFinishedAt: toNumber(source.transcodeFinishedAt),
    transcodeStartedAt: toNumber(source.transcodeStartedAt),
    userId: undefined,
  } as ResourceSource;
}

function convertSourceFile(sourceFile: SourceFile): ResourceSourceFile {
  return {
    ...sourceFile,
    createdAt: toNumber(sourceFile.createdAt),
    updatedAt: toNumber(sourceFile.updatedAt),
    uploadedAt: toNumber(sourceFile.uploadedAt),
    userId: undefined,
  } as ResourceSourceFile;
}

function convertTrackCoArtist(
  trackCoArtist: TrackCoArtist
): ResourceTrackCoArtist {
  return {
    ...trackCoArtist,
    createdAt: toNumber(trackCoArtist.createdAt),
    updatedAt: toNumber(trackCoArtist.updatedAt),
    userId: undefined,
  } as ResourceTrackCoArtist;
}

function convertDeletion(deletion: Deletion): ResourceDeletion {
  return {
    ...deletion,
    deletedAt: toNumber(deletion.deletedAt),
    userId: undefined,
  } as ResourceDeletion;
}

function convertUser(user: User): ResourceUser {
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

export function fetchResources(
  userId: string,
  since?: number | null
): Promise<ResourcesNotUpdated | ResourcesUpdated> {
  const nSince = Number(since || 0);
  if (!isFinite(nSince)) {
    throw new HTTPError(400, 'Invalid since parameter');
  }

  const initTimestamp = Date.now();

  return client.$transaction(
    async (txClient): Promise<ResourcesNotUpdated | ResourcesUpdated> => {
      const resourceUpdate = await txClient.resourceUpdate.findUnique({
        where: {
          userId,
        },
        select: {
          updatedAt: true,
        },
      });

      if (!resourceUpdate) {
        throw new HTTPError(404, `User ${userId} not found`);
      }

      const updatedAt = Number(resourceUpdate.updatedAt);

      // some clock skew may occur because of transaction
      const timestamp = Math.max(
        initTimestamp - RESOURCE_TIMESTAMP_MARGIN,
        Math.min(updatedAt + 1, initTimestamp)
      );

      if (updatedAt < nSince) {
        return {
          updated: false,
          timestamp,
          updatedAt,
        } as const;
      }

      const dbUser = await txClient.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!dbUser) {
        throw new HTTPError(404, `User ${userId} not found`);
      }

      const q = {
        where: {
          userId,
          updatedAt:
            nSince > 0
              ? {
                  gte: dbGetTimestamp(nSince),
                }
              : undefined,
        },
      } as const;

      const qFiles = {
        ...q,
        include: {
          files: true,
        },
      } as const;

      const qDel = {
        where: {
          userId,
          deletedAt: q.where.updatedAt,
        },
      } as const;

      return {
        updated: true,
        timestamp,
        updatedAt,
        user: convertUser(dbUser),
        albumCoArtists: (await txClient.albumCoArtist.findMany(q)).map(
          convertAlbumCoArtist
        ),
        albums: (await txClient.album.findMany(q)).map(convertAlbum),
        artists: (await txClient.artist.findMany(q)).map(convertArtist),
        images: (await txClient.image.findMany(qFiles)).map(convertImage),
        playlists: (await txClient.playlist.findMany(q)).map(convertPlaylist),
        sourceFiles: (await txClient.sourceFile.findMany(q)).map(
          convertSourceFile
        ),
        sources: (await txClient.source.findMany(q)).map(convertSource),
        trackCoArtists: (await txClient.trackCoArtist.findMany(q)).map(
          convertTrackCoArtist
        ),
        tracks: (await txClient.track.findMany(qFiles)).map(convertTrack),
        deletions: (await txClient.deletion.findMany(qDel)).map(
          convertDeletion
        ),
      };
    }
  );
}
