import type {
  Album,
  AlbumCoArtist,
  Artist,
  Image,
  Playlist,
  Tag,
  Track,
  TrackCoArtist,
  User,
} from '$prisma/client';

export type Methods = {
  get: {
    query?: {
      since: number;
    };
    resBody: {
      timestamp: number;
      user: User;
      albumCoArtists: AlbumCoArtist[];
      albums: Album[];
      artists: Artist[];
      images: Image[];
      playlists: Playlist[];
      tags: Tag[];
      trackCoArtists: TrackCoArtist[];
      tracks: Track[];
    };
  };
};
