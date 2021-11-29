import { createHash } from 'crypto';
import { client } from './client';

function prng(seed: string): () => number {
  let ctr: Buffer = Buffer.from(seed);
  return () => {
    ctr = createHash('sha256').update(ctr).digest();
    return ctr.readUInt32LE(0) / 0xffffffff;
  };
}

export function init(): Promise<void> {
  return client.$transaction(
    async (txClient): Promise<void> => {
      if ((await txClient.user.count()) !== 0) {
        throw new Error('data already set');
      }

      const rand = prng('20211103');

      let userCounter = 0;
      let sourceCounter = 0;
      let artistCounter = 0;
      let albumCounter = 0;
      let trackCounter = 0;
      let playlistCounter = 0;

      // create sentinel nodes
      {
        const id = '/';

        await txClient.user.create({
          data: {
            id,
            name: '',
            email: '',
          },
        });

        await txClient.tag.create({
          data: {
            id,
            name: '',
            userId: id,
          },
        });

        await txClient.source.create({
          data: {
            id,
            userId: id,
          },
        });

        await txClient.artist.create({
          data: {
            id,
            name: '',
            userId: id,
          },
        });

        await txClient.album.create({
          data: {
            id,
            title: '',
            userId: id,
            artistId: id,
          },
        });

        await txClient.track.create({
          data: {
            id,
            title: '',
            userId: id,
            artistId: id,
            albumId: id,
            sourceId: id,
          },
        });

        await txClient.playlist.create({
          data: {
            id,
            name: '',
            userId: id,
          },
        });
      }

      for (let i = 0; i < 10; i++) {
        const userId = `us${++userCounter}`;
        await txClient.user.create({
          data: {
            id: userId,
            name: `User.${userId}`,
            email: `${userId}@example.org`,
          },
        });

        const sourceId = `so${++sourceCounter}`;
        await txClient.source.create({
          data: {
            id: sourceId,
            userId,
          },
        });

        // create artists
        const artistIds: string[] = [];
        for (let j = 0; j < 5; j++) {
          const artistId = `ar${++artistCounter}`;
          await txClient.artist.create({
            data: {
              id: artistId,
              name: `Artist.${artistId}`,
              userId,
            },
          });
          artistIds.push(artistId);
        }

        // create albums
        const albumIds: string[] = [];
        for (let j = 0; j < 20; j++) {
          const artistId = artistIds[Math.floor(rand() * artistIds.length)];
          const albumId = `al${++albumCounter}`;
          await txClient.album.create({
            data: {
              id: albumId,
              title: `Album.${albumId}`,
              userId,
              artistId,
            },
          });
          albumIds.push(albumId);
        }

        // create tracks
        const trackIds: string[] = [];
        for (let j = 0; j < 50; j++) {
          const artistId = artistIds[Math.floor(rand() * artistIds.length)];
          const albumId = albumIds[Math.floor(rand() * albumIds.length)];
          const trackId = `tr${++trackCounter}`;
          await txClient.track.create({
            data: {
              id: trackId,
              title: `Track.${trackId}`,
              userId,
              artistId,
              albumId,
              sourceId: sourceId,
            },
          });
          trackIds.push(trackId);
        }

        // create playlist
        for (let j = 0; j < 10; j++) {
          const playlistId = `pl${++playlistCounter}`;
          await txClient.playlist.create({
            data: {
              id: playlistId,
              name: `Playlist.${playlistId}`,
              userId,
            },
          });

          // add sentinel nodes
          await txClient.playlistTrack.create({
            data: {
              playlistId: playlistId,
              userId,
              trackId: '/',
              nextTrackId: null,
            },
          });

          // TODO: add tracks to playlist
        }
      }

      // create some clean users
      for (let i = 1; i <= 10; i++) {
        const userId = `usc${i}`;
        await txClient.user.create({
          data: {
            id: userId,
            name: `User.Clean.${userId}`,
            email: `${userId}@example.org`,
          },
        });
      }
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );
}
