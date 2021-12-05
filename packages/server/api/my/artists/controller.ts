import { generateArtistId } from '$shared-server/generateId';
import { dbArtistGetOrCreateByName } from '$/db/artist';
import { client } from '$/db/lib/client';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ user }) => {
    const artists = await client.artist.findMany({
      where: {
        userId: user.id,
      },
    });
    return { status: 200, body: artists };
  },
  post: async ({ body, query, user }) => {
    const newArtistId = await generateArtistId();
    const artist = query?.forceNewArtist
      ? await client.artist.create({
          data: {
            id: newArtistId,
            name: body.name,
            userId: user.id,
          },
        })
      : await dbArtistGetOrCreateByName(user.id, body.name, newArtistId);

    return {
      status: artist.id === newArtistId ? 201 : 200,
      body: artist,
    };
  },
}));
