import { defineController } from './$relay';
import { client } from '$/db/lib/client';
import { generateArtistId } from '$/utils/id';
import { dbArtistGetOrCreateByName } from '$/db/artist';

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
