import type { User } from '@prisma/client';
import { generateUserId } from '$shared-server/generateId';
import { INITIAL_PLAN } from '$shared/config';
import { client } from '$/db/lib/client';
import { calcPasswordHashAsync } from '$/services/password';
import type { IAccountCreateData } from '$/validators';

export async function userDoesExist(username: string): Promise<boolean> {
  const count = await client.user.count({
    where: {
      username: String(username),
    },
  });

  return count !== 0;
}

export async function userCreate(data: IAccountCreateData): Promise<User> {
  const { displayName, region, username } = data;

  const passwordHash = await calcPasswordHashAsync(data.password);

  const timestamp = Date.now();

  const userId = await generateUserId();

  const user = await client.$transaction(async (txClient): Promise<User> => {
    const user = await txClient.user.create({
      data: {
        id: userId,
        username,
        password: passwordHash,
        displayName,
        region,
        plan: INITIAL_PLAN,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    await txClient.resourceUpdate.create({
      data: {
        userId,
        updatedAt: timestamp,
      },
    });

    return user;
  });

  return user;
}
