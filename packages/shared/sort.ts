import type {
  Album,
  AlbumCoArtist,
  Artist,
  Playlist,
  Track,
  TrackCoArtist,
} from '$prisma/client';
import { CO_ARTIST_ROLE_PREFIX_BUILTIN } from './coArtist';

/* eslint-disable no-use-before-define */

interface AlbumLike extends Readonly<Album> {
  readonly artist?: ArtistLike;
  readonly tracks?: readonly TrackLike[];
}

interface ArtistLike extends Readonly<Artist> {
  readonly albums?: readonly AlbumLike[];
  readonly tracks?: readonly TrackLike[];
}

interface TrackLike extends Readonly<Track> {
  readonly artist?: ArtistLike;
  readonly album?: AlbumLike;
}

interface PlaylistLike extends Readonly<Playlist> {
  readonly tracks?: readonly TrackLike[];
}

type CoArtist = AlbumCoArtist | TrackCoArtist;

/* eslint-enable no-use-before-define */

let gLocaleStringComparer: ((a: string, b: string) => number) | undefined;

/**
 * 2つの文字列`a`と`b`について`a - b`を計算して返す \
 * すなわち`a < b`なら負の値を、`a > b`なら正の値を、`a === b`なら0を返す
 * @param a a
 * @param b b
 * @return `a - b`
 */
export function compareString(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * 2つの文字列`a`と`b`について`a - b`を計算して返す関数を作成する \
 * すなわち`a < b`なら負の値を、`a > b`なら正の値を、`a === b`なら0を返す
 * @return `a - b`を計算する関数
 */
export function createLocaleStringComparer(): (a: string, b: string) => number {
  try {
    if (window.Intl?.Collator) {
      const collator = new window.Intl.Collator(
        [...window.navigator.languages],
        {
          usage: 'sort',
          numeric: true,
        }
      );
      return collator.compare.bind(collator);
    }
  } catch (_error) {
    // do nothing; use fallback
  }
  // fallback
  return compareString;
}

/**
 * 2つの文字列`a`と`b`について`a - b`を計算して返す \
 * すなわち`a < b`なら負の値を、`a > b`なら正の値を、`a === b`なら0を返す
 * @param a a
 * @param b b
 * @return `a - b`
 */
export function compareLocaleString(a: string, b: string): number {
  if (!gLocaleStringComparer) {
    gLocaleStringComparer = createLocaleStringComparer();
  }
  return gLocaleStringComparer(a, b);
}

export function compareArtist(a: ArtistLike, b: ArtistLike): number {
  return (
    compareLocaleString(a.nameSort || a.name, b.nameSort || b.name) ||
    compareString(a.id, b.id)
  );
}

export function compareAlbum(a: AlbumLike, b: AlbumLike): number {
  return (
    (a.artist && b.artist ? compareArtist(a.artist, b.artist) : 0) ||
    compareLocaleString(a.titleSort || a.title, b.titleSort || b.title) ||
    compareString(a.id, b.id)
  );
}

export function compareTrack(a: TrackLike, b: TrackLike): number {
  return (
    (a.album && b.album ? compareAlbum(a.album, b.album) : 0) ||
    a.discNumber - b.discNumber ||
    a.trackNumber - b.trackNumber ||
    (a.artist && b.artist ? compareArtist(a.artist, b.artist) : 0) ||
    compareLocaleString(a.titleSort || a.title, b.titleSort || b.title) ||
    compareString(a.id, b.id)
  );
}

export function comparePlaylist(a: PlaylistLike, b: PlaylistLike): number {
  return compareLocaleString(a.title, b.title) || compareString(a.id, b.id);
}

export function compareCoArtist(a: CoArtist, b: CoArtist): number {
  const isBuiltinA = a.role[0] === CO_ARTIST_ROLE_PREFIX_BUILTIN ? 1 : 0;
  const isBuiltinB = b.role[0] === CO_ARTIST_ROLE_PREFIX_BUILTIN ? 1 : 0;
  return (
    isBuiltinB - isBuiltinA ||
    (isBuiltinA
      ? compareString(a.role, b.role)
      : compareLocaleString(a.role, b.role)) ||
    compareString(a.artistId, b.artistId) ||
    compareString(a.id, b.id)
  );
}
