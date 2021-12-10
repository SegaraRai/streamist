import type { Table } from 'dexie';
import api from '~/logic/api';
import { db } from '.';

async function clearAndAdd<T, U>(
  table: Table<T, U>,
  items: readonly T[]
): Promise<void> {
  await table.clear();
  if (items.length === 0) {
    return;
  }
  // bulkAdd is faster than bulkPut
  await table.bulkAdd(items);
}

async function update<T, U>(
  table: Table<T, U>,
  items: readonly T[]
): Promise<void> {
  /*
  if (items.length === 0) {
    return;
  }
  //*/
  await table.bulkPut(items);
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
    const resources = await api.my.resources.$get({
      query: {
        since,
      },
    });

    console.log(since, resources);

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
        db.tags,
        db.trackCoArtists,
        db.tracks,
      ],
      async () => {
        if (reconstruct) {
          localStorage.removeItem('db.lastUpdate');
          await Promise.all([
            clearAndAdd(db.albumCoArtists, resources.albumCoArtists),
            clearAndAdd(db.albums, resources.albums),
            clearAndAdd(db.artists, resources.artists),
            clearAndAdd(db.images, resources.images),
            clearAndAdd(db.playlists, resources.playlists),
            clearAndAdd(db.sourceFiles, resources.sourceFiles),
            clearAndAdd(db.sources, resources.sources),
            clearAndAdd(db.tags, resources.tags),
            clearAndAdd(db.trackCoArtists, resources.trackCoArtists),
            clearAndAdd(db.tracks, resources.tracks),
          ]);
        } else {
          await Promise.all([
            update(db.albumCoArtists, resources.albumCoArtists),
            update(db.albums, resources.albums),
            update(db.artists, resources.artists),
            update(db.images, resources.images),
            update(db.playlists, resources.playlists),
            update(db.sourceFiles, resources.sourceFiles),
            update(db.sources, resources.sources),
            update(db.tags, resources.tags),
            update(db.trackCoArtists, resources.trackCoArtists),
            update(db.tracks, resources.tracks),
          ]);
        }
      }
    );

    localStorage.setItem('db.lastUpdate', resources.timestamp.toString());
  } finally {
    localStorage.removeItem('db.updating');
  }
}

(window as any).syncDB = syncDB;
