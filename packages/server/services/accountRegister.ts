import type { User } from '@prisma/client';
import { generateUserId } from '$shared-server/generateId';
import { isReservedUsername } from '$shared-server/reservedUsernames';
import { INITIAL_PLAN } from '$shared/config';
import { client } from '$/db/lib/client';
import { dbGetTimestamp } from '$/db/lib/timestamp';
import { calcPasswordHashAsync } from '$/services/password';
import { HTTPError } from '$/utils/httpError';
import type { IAccountCreateData } from '$/validators';

export async function userDoesExist(username: string): Promise<boolean> {
  if (isReservedUsername(username)) {
    return true;
  }

  const count = await client.user.count({
    where: {
      username: String(username),
    },
  });

  return count !== 0;
}

export async function userCreate(data: IAccountCreateData): Promise<User> {
  const { displayName, region, username } = data;

  if (isReservedUsername(username)) {
    throw new HTTPError(400, 'username is reserved');
  }

  const passwordHash = await calcPasswordHashAsync(data.password);

  const timestamp = dbGetTimestamp();

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
