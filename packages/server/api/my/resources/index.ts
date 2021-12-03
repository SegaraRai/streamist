import type {
  Album,
  AlbumCoArtist,
  AlbumImage,
  Artist,
  Image,
  Playlist,
  PlaylistTrack,
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
      albumImages: AlbumImage[];
      albums: Album[];
      artists: Artist[];
      images: Image[];
      playlistTracks: PlaylistTrack[];
      playlists: Playlist[];
      tags: Tag[];
      trackCoArtists: TrackCoArtist[];
      tracks: Track[];
    };
  };
};
