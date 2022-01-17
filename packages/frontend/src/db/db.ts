import { Dexie, Table } from 'dexie';
import type { ResourcesUpdated } from '$/types';

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

// though this can be expressed by recursive type, it's easier to write like this
type DexieSchemaCompound<T extends string> = `${T}+${T}` | `${T}+${T}+${T}`;
type DexieSchemaDecorated<T extends string> = T | `++${T}` | `&${T}` | `*${T}`;
type DexieSchema<T extends string> =
  | DexieSchemaDecorated<T>
  | DexieSchemaDecorated<`[${DexieSchemaCompound<T>}]`>;

type DBResources = Pick<
  ResourcesUpdated,
  | 'albumCoArtists'
  | 'albums'
  | 'artists'
  | 'images'
  | 'playlists'
  | 'sourceFiles'
  | 'sources'
  | 'trackCoArtists'
  | 'tracks'
>;

type DBResourcesValueKeys<T> = T extends keyof DBResources
  ? keyof DBResources[T][number]
  : never;

type DBResourcesSchemaInputSubset<T> = T extends keyof DBResources
  ? Record<T, readonly DexieSchema<DBResourcesValueKeys<T>>[]>
  : never;
type DBResourcesSchemaInputSubsetUnion = DBResourcesSchemaInputSubset<
  keyof DBResources
>;
type DBResourcesSchemaInput =
  UnionToIntersection<DBResourcesSchemaInputSubsetUnion>;

type DBResourcesSchema = Record<keyof DBResourcesSchemaInput, string>;

function createSchema(schema: DBResourcesSchemaInput): DBResourcesSchema {
  return Object.fromEntries(
    Object.entries(schema).map(
      ([key, indices]) => [key, indices.join()] as const
    )
  ) as DBResourcesSchema;
}

export class ResourcesDexie extends Dexie {
  readonly albumCoArtists!: Table<DBResources['albumCoArtists'][number]>;
  readonly albums!: Table<DBResources['albums'][number]>;
  readonly artists!: Table<DBResources['artists'][number]>;
  readonly images!: Table<DBResources['images'][number]>;
  readonly playlists!: Table<DBResources['playlists'][number]>;
  readonly sourceFiles!: Table<DBResources['sourceFiles'][number]>;
  readonly sources!: Table<DBResources['sources'][number]>;
  readonly trackCoArtists!: Table<DBResources['trackCoArtists'][number]>;
  readonly tracks!: Table<DBResources['tracks'][number]>;

  constructor() {
    super('resources');

    this.version(1).stores(
      createSchema({
        albumCoArtists: ['&[role+albumId+artistId]', 'albumId', 'artistId'],
        albums: ['&id', 'artistId', '*imageIds'],
        artists: ['&id'],
        images: ['&id'],
        playlists: ['&id', '*trackIds'],
        sourceFiles: ['&id', 'sourceId'],
        sources: ['&id'],
        trackCoArtists: ['&[role+trackId+artistId]', 'trackId', 'artistId'],
        tracks: ['&id', 'albumId', 'artistId'],
      })
    );
  }
}

export const db = new ResourcesDexie();
