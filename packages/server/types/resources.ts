import type {
  Album,
  AlbumCoArtist,
  Artist,
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

export interface ResourceImage extends Image {
  files: ImageFile[];
}

export interface ResourcePlaylist extends Playlist {
  trackIds: string[];
}

export interface ResourceTrack extends Track {
  files: TrackFile[];
}

export type ResourceUser = Omit<User, ''>;

export interface Resources {
  timestamp: number;
  user: ResourceUser;
  albumCoArtists: AlbumCoArtist[];
  albums: ResourceAlbum[];
  artists: Artist[];
  images: ResourceImage[];
  playlists: ResourcePlaylist[];
  sourceFiles: SourceFile[];
  sources: Source[];
  tags: Tag[];
  trackCoArtists: TrackCoArtist[];
  tracks: ResourceTrack[];
}
