import type { User } from '@prisma/client';
import { generateUserId } from '$shared-server/generateId';
import { INITIAL_PLAN } from '$shared/config';
import { client } from '$/db/lib/client';
import { HCAPTCHA_SITE_KEY_REGISTRATION } from '$/services/env';
import { verifyHCaptcha } from '$/services/hCaptcha';
import { calcPasswordHashAsync } from '$/services/password';
import { HTTPError } from '$/utils/httpError';
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
  const { captchaResponse, displayName, region, username } = data;

  const isCaptchaOk = await verifyHCaptcha(
    HCAPTCHA_SITE_KEY_REGISTRATION,
    captchaResponse
  );

  if (!isCaptchaOk) {
    throw new HTTPError(400, 'Captcha is not valid');
  }

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
