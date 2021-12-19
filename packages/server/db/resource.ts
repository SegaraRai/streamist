import { client } from './lib/client';

/**
 * this function will not throw exceptions
 * @param userId
 */
export async function updateUserResourceTimestamp(
  userId: string
): Promise<void> {
  try {
    const updatedAt = Date.now();
    await client.resourceUpdate.updateMany({
      where: {
        userId,
        updatedAt: {
          lt: updatedAt,
        },
      },
      data: {
        updatedAt,
      },
    });
  } catch (e) {
    console.error(e);
  }
}
