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
      select: { plan: true },
    });
    if (!user) {
      return;
    }

    const numMaxTracks = MAX_TRACKS_PER_PLAN[user.plan as Plan] || 0;
    if (numMaxTracks === Infinity) {
      return;
    }

    const maxTrack = await client.track.findFirst({
      where: { userId },
      orderBy: { id: 'asc' },
      select: { id: true },
      skip: Math.max(numMaxTracks - 1, 0),
      take: 1,
    });

    const updated = await client.user.updateMany({
      where: { id: userId, plan: user.plan, maxTrackId: { not: maxTrack?.id } },
      data: { maxTrackId: maxTrack?.id ?? null, updatedAt: Date.now() },
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
