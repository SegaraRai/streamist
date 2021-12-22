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
  | 'tags'
  | 'trackCoArtists'
  | 'tracks'
>;

type DBResourcesValueKeys<T> = T extends keyof DBResources
  ? keyof DBResources[T][0]
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
  readonly albumCoArtists!: Table<DBResources['albumCoArtists'][0]>;
  readonly albums!: Table<DBResources['albums'][0]>;
  readonly artists!: Table<DBResources['artists'][0]>;
  readonly images!: Table<DBResources['images'][0]>;
  readonly playlists!: Table<DBResources['playlists'][0]>;
  readonly sourceFiles!: Table<DBResources['sourceFiles'][0]>;
  readonly sources!: Table<DBResources['sources'][0]>;
  readonly tags!: Table<DBResources['tags'][0]>;
  readonly trackCoArtists!: Table<DBResources['trackCoArtists'][0]>;
  readonly tracks!: Table<DBResources['tracks'][0]>;

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
        tags: ['&id', 'name'],
        trackCoArtists: ['&[role+trackId+artistId]', 'trackId', 'artistId'],
        tracks: ['&id', 'albumId', 'artistId'],
      })
    );
  }
}

export const db = new ResourcesDexie();
