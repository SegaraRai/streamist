import { client } from './client';

export function init(): Promise<void> {
  return client.$transaction(
    async (txClient): Promise<void> => {
      if ((await txClient.user.count()) !== 0) {
        throw new Error('data already set');
      }

      // create some clean users
      for (let i = 1; i <= 10; i++) {
        const userId = `usc${i}`;
        await txClient.user.create({
          data: {
            id: userId,
            name: `User.Clean.${userId}`,
            email: `${userId}@example.org`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        });

        await txClient.resourceUpdate.create({
          data: {
            userId,
            updatedAt: Date.now(),
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
