import type { IndexableType, Table } from 'dexie';
import { useMessage } from 'naive-ui';
import type { DeletionEntityType } from '$shared/types';
import type { ResourceDeletion, ResourceUser } from '$/types';
import { api } from '~/logic/api';
import { renewTokensAndSetCDNCookie } from '~/logic/cdnCookie';
import { db } from './db';
import { useLocalStorageDB } from './localStorage';

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

async function syncDB(
  {
    dbLastUpdate$$q,
    dbNextSince$$q,
    dbUpdating$$q,
    dbUser$$q,
  }: ReturnType<typeof useLocalStorageDB>,
  reconstruct = false
): Promise<void> {
  let since: number | undefined = reconstruct ? 0 : dbNextSince$$q.value;
  dbUpdating$$q.value = true;

  if (!since || !isFinite(since) || since <= 0) {
    since = undefined;
    reconstruct = true;
  }

  try {
    dbLastUpdate$$q.value = Date.now();

    const r = await api.my.resources.$get({
      query: {
        since,
      },
    });

    console.log(since, r);

    if (r.updated) {
      const oldUser: ResourceUser | null = dbUser$$q.value;

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
        async (): Promise<void> => {
          if (reconstruct) {
            dbNextSince$$q.value = undefined;
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

      dbUser$$q.value = r.user;

      if (
        r.user.plan !== oldUser?.plan ||
        r.user.maxTrackId !== oldUser?.maxTrackId
      ) {
        renewTokensAndSetCDNCookie(true);
      }
    }

    dbNextSince$$q.value = r.timestamp;
  } finally {
    dbUpdating$$q.value = undefined;
  }
}

export function useSyncDB(): (reconstruct?: boolean) => Promise<void> {
  const { t } = useI18n();
  const message = useMessage();
  const localStorageDB = useLocalStorageDB();

  return (reconstruct = false): Promise<void> =>
    syncDB(localStorageDB, reconstruct)
      .then((): void => {
        message.success(t('message.SyncedDatabase'));
      })
      .catch((error): void => {
        message.error(t('message.FailedToSyncDatabase', [String(error)]));
      });
}
