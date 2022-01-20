import type { User } from '@prisma/client';
import { client } from '$/db/lib/client';
import { HTTPError } from '$/utils/httpError';
import type { IAccountUpdateData } from '$/validators';
import { calcPasswordHashAsync, verifyPasswordHashAsync } from './password';

export async function userUpdate(
  userId: string,
  data: IAccountUpdateData
): Promise<User> {
  const { displayName, region, username } = data;

  const requiresCurrentPassword = username != null || data.password != null;
  if (requiresCurrentPassword) {
    if (!data.currentPassword) {
      throw new HTTPError(
        400,
        'currentPassword is required for updating username and password'
      );
    }

    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        password: true,
      },
    });
    if (!user) {
      throw new HTTPError(404, 'User not found');
    }

    const isOk = verifyPasswordHashAsync(data.currentPassword, user.password);
    if (!isOk) {
      throw new HTTPError(401, 'currentPassword does not match');
    }
  }

  const passwordHash =
    data.password != null
      ? await calcPasswordHashAsync(data.password)
      : undefined;

  const user = await client.user.update({
    where: { id: userId },
    data: {
      username,
      password: passwordHash,
      displayName,
      region,
      updatedAt: Date.now(),
    },
  });

  return user;
}
