import api from '~/logic/api';
import { db } from '.';

export async function syncDB(reconstruct = false): Promise<void> {
  let since: number | undefined = parseInt(
    localStorage.getItem('db.lastUpdate') || '0',
    10
  );
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
            db.albumCoArtists.clear(),
            db.albums.clear(),
            db.artists.clear(),
            db.images.clear(),
            db.playlists.clear(),
            db.sourceFiles.clear(),
            db.sources.clear(),
            db.tags.clear(),
            db.trackCoArtists.clear(),
            db.tracks.clear(),
          ]);
        }

        await Promise.all([
          db.albumCoArtists.bulkPut(resources.albumCoArtists),
          db.albums.bulkPut(resources.albums),
          db.artists.bulkPut(resources.artists),
          db.images.bulkPut(resources.images),
          db.playlists.bulkPut(resources.playlists),
          db.sourceFiles.bulkPut(resources.sourceFiles),
          db.sources.bulkPut(resources.sources),
          db.tags.bulkPut(resources.tags),
          db.trackCoArtists.bulkPut(resources.trackCoArtists),
          db.tracks.bulkPut(resources.tracks),
        ]);
      }
    );

    localStorage.setItem('db.lastUpdate', resources.timestamp.toString());
  } finally {
    localStorage.removeItem('db.updating');
  }
}
