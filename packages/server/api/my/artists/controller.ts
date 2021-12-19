import { generateArtistId } from '$shared-server/generateId';
import { dbArtistGetOrCreateByName } from '$/db/artist';
import { client } from '$/db/lib/client';
import { updateUserResourceTimestamp } from '$/db/resource';
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
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        })
      : await dbArtistGetOrCreateByName(user.id, body.name, newArtistId);

    const created = artist.id === newArtistId;
    if (created) {
      await updateUserResourceTimestamp(user.id);
    }

    return {
      status: created ? 201 : 200,
      body: artist,
    };
  },
}));
