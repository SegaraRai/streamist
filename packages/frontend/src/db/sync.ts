import type { IndexableType, Table } from 'dexie';
import type { DeletionEntityType } from '$shared/types/db';
import api from '~/logic/api';
import type { ResourceDeletion } from '$/types';
import { db } from '.';

async function clearAndAdd<T>(
  table: Table<T, IndexableType>,
  items: readonly T[]
): Promise<void> {
  await table.clear();
  // bulkAdd is faster than bulkPut
  await table.bulkAdd(items);
}

async function update<T>(
  table: Table<T, IndexableType>,
  items: readonly T[],
  deletedItemIds: IndexableType[]
): Promise<void> {
  await table.bulkDelete(deletedItemIds);
  await table.bulkPut(items);
}

async function deleteByParent<T>(
  table: Table<T, IndexableType>,
  key: keyof T,
  deletedItemIds: readonly string[]
): Promise<void> {
  await table
    .where(key as string)
    .anyOf(deletedItemIds)
    .delete();
}

function getDeletionIds(
  deletions: readonly ResourceDeletion[],
  type: DeletionEntityType
): string[] {
  return deletions
    .filter((item) => item.entityType === type)
    .map((item) => item.entityId);
}

export async function syncDB(reconstruct = false): Promise<void> {
  let since: number | undefined = reconstruct
    ? 0
    : parseInt(localStorage.getItem('db.lastUpdate') || '0', 10);
  localStorage.setItem('db.updating', '1');

  if (!since || !isFinite(since) || since <= 0) {
    since = undefined;
    reconstruct = true;
  }

  try {
    const r = await api.my.resources.$get({
      query: {
        since,
      },
    });

    console.log(since, r);

    if (r.updated) {
      const d = {
        albumCoArtists: getDeletionIds(r.deletions, 'albumCoArtist'),
        albums: getDeletionIds(r.deletions, 'album'),
        artists: getDeletionIds(r.deletions, 'artist'),
        images: getDeletionIds(r.deletions, 'image'),
        playlists: getDeletionIds(r.deletions, 'playlist'),
        sourceFiles: getDeletionIds(r.deletions, 'sourceFile'),
        sources: getDeletionIds(r.deletions, 'source'),
        trackCoArtists: getDeletionIds(r.deletions, 'trackCoArtist'),
        tracks: getDeletionIds(r.deletions, 'track'),
      };

      await db.transaction(
        'rw',
        [
          db.albumCoArtists,
          db.albums,
          db.artists,
          db.images,
          db.playlists,
          db.sourceFiles,
          db.sources,
          db.trackCoArtists,
          db.tracks,
        ],
        async () => {
          if (reconstruct) {
            localStorage.removeItem('db.lastUpdate');
            await Promise.all([
              clearAndAdd(db.albumCoArtists, r.albumCoArtists),
              clearAndAdd(db.albums, r.albums),
              clearAndAdd(db.artists, r.artists),
              clearAndAdd(db.images, r.images),
              clearAndAdd(db.playlists, r.playlists),
              clearAndAdd(db.sourceFiles, r.sourceFiles),
              clearAndAdd(db.sources, r.sources),
              clearAndAdd(db.trackCoArtists, r.trackCoArtists),
              clearAndAdd(db.tracks, r.tracks),
            ]);
          } else {
            await Promise.all([
              deleteByParent(db.albumCoArtists, 'albumId', d.albums),
              update(db.albumCoArtists, r.albumCoArtists, d.albumCoArtists),
              update(db.albums, r.albums, d.albums),
              update(db.artists, r.artists, d.artists),
              update(db.images, r.images, d.images),
              update(db.playlists, r.playlists, d.playlists),
              update(db.sourceFiles, r.sourceFiles, d.sourceFiles),
              update(db.sources, r.sources, d.sources),
              deleteByParent(db.trackCoArtists, 'trackId', d.tracks),
              update(db.trackCoArtists, r.trackCoArtists, d.trackCoArtists),
              update(db.tracks, r.tracks, d.tracks),
            ]);
          }
        }
      );
    }

    localStorage.setItem('db.lastUpdate', r.timestamp.toString());
  } finally {
    localStorage.removeItem('db.updating');
  }
}

(window as any).syncDB = syncDB;
