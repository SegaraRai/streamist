import { USER_TREAT_AS_DELETED_AFTER_CLOSE } from '$shared/config/user';
import { client } from '$/db/lib/client';
import { osDeleteImageFiles } from '$/os/imageFile';
import { osDeleteSourceFiles } from '$/os/sourceFile';
import { osDeleteTrackFiles } from '$/os/trackFile';

export async function cleanupClosedAccounts(): Promise<void> {
  const deleteClosedAt = Date.now() - USER_TREAT_AS_DELETED_AFTER_CLOSE;

  const users = await client.user.findMany({
    where: {
      closedAt: {
        lt: deleteClosedAt,
      },
    },
    select: {
      id: true,
    },
  });

  for (const user of users) {
    const userId = user.id;

    const sourceFiles = await client.sourceFile.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        region: true,
        sourceId: true,
        userId: true,
      },
    });

    const imageFiles = await client.imageFile.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        region: true,
        extension: true,
        imageId: true,
        userId: true,
      },
    });

    const trackFiles = await client.trackFile.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        region: true,
        extension: true,
        trackId: true,
        userId: true,
      },
    });

    const deleted = await client.user.deleteMany({
      where: {
        id: userId,
      },
    });

    if (deleted.count === 0) {
      continue;
    }

    // delete objects from s3
    await osDeleteImageFiles(imageFiles);
    await osDeleteTrackFiles(trackFiles);
    await osDeleteSourceFiles(sourceFiles);
  }
}
