import { client } from './client.js';

export function truncate(): Promise<void> {
  return client.$transaction(async (txClient): Promise<void> => {
    await txClient.playlist.deleteMany();
    await txClient.imageFile.deleteMany();
    await txClient.image.deleteMany();
    await txClient.trackCoArtist.deleteMany();
    await txClient.trackFile.deleteMany();
    await txClient.track.deleteMany();
    await txClient.albumCoArtist.deleteMany();
    await txClient.album.deleteMany();
    await txClient.artist.deleteMany();
    await txClient.sourceFile.deleteMany();
    await txClient.source.deleteMany();
    await txClient.user.deleteMany();
  });
}
