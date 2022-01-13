import { MAX_TRACKS_PER_PLAN, Plan } from '$shared/config/plans';
import { client } from '$/db/lib/client';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { logger } from '$/services/logger';

export async function updateMaxTrackId(
  userId: string,
  skipUpdateTimestamp = false
): Promise<void> {
  try {
    const user = await client.user.findFirst({
      where: { id: userId },
      select: { maxTrackId: true, plan: true },
    });
    if (!user) {
      return;
    }

    const numMaxTracks = MAX_TRACKS_PER_PLAN[user.plan as Plan] || 0;

    if (numMaxTracks === Infinity && !user.maxTrackId) {
      return;
    }

    const maxTrack =
      numMaxTracks === Infinity
        ? null
        : await client.track.findFirst({
            where: { userId },
            orderBy: { id: 'asc' },
            select: { id: true },
            skip: Math.max(numMaxTracks - 1, 0),
            take: 1,
          });

    const newMaxTrackId = maxTrack?.id ?? null;

    const updated = await client.user.updateMany({
      where: {
        id: userId,
        plan: user.plan,
        OR: newMaxTrackId
          ? [
              {
                maxTrackId: { not: newMaxTrackId },
              },
              {
                maxTrackId: null,
              },
            ]
          : [
              {
                maxTrackId: { not: null },
              },
            ],
      },
      data: { maxTrackId: newMaxTrackId, updatedAt: Date.now() },
    });

    if (updated.count && !skipUpdateTimestamp) {
      await dbResourceUpdateTimestamp(userId);
    }
  } catch (error) {
    logger.error(
      error,
      `updateMaxTrackId: failed to update maxTrackId for ${userId}`
    );
  }
}
