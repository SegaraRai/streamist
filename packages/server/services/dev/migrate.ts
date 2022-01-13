import fetch from 'node-fetch';
import {
  OSRegion,
  ObjectStorage,
  getOSRawURL,
  getSourceFileKey,
  getSourceFileOS,
  getTranscodedAudioFileKey,
  getTranscodedAudioFileOS,
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
} from '$shared/objectStorage';
import { client } from '$/db/lib/client';

export async function devMigrate(): Promise<void> {
  const getOldKey = (key: string): string =>
    key.replace(/\/[^/]+(\/[^/]+)$/, '$1');

  const rename = async (os: ObjectStorage, newKey: string): Promise<void> => {
    const oldKey = getOldKey(newKey);
    const response = await fetch(getOSRawURL(os, oldKey), {
      method: 'MOVE',
      headers: {
        Destination: newKey,
        Referer: 'development_secret_referer_for_migration',
      },
    });
    console.log('renamed', oldKey, response.status);
  };

  const sourceFiles = await client.sourceFile.findMany();
  for (const sourceFile of sourceFiles) {
    await rename(
      getSourceFileOS(sourceFile.region as OSRegion),
      getSourceFileKey(sourceFile.userId, sourceFile.sourceId, sourceFile.id)
    );
  }

  const trackFiles = await client.trackFile.findMany();
  for (const trackFile of trackFiles) {
    await rename(
      getTranscodedAudioFileOS(trackFile.region as OSRegion),
      getTranscodedAudioFileKey(
        trackFile.userId,
        trackFile.trackId,
        trackFile.id,
        trackFile.extension
      )
    );
  }

  const imageFiles = await client.imageFile.findMany();
  for (const imageFile of imageFiles) {
    await rename(
      getTranscodedImageFileOS(imageFile.region as OSRegion),
      getTranscodedImageFileKey(
        imageFile.userId,
        imageFile.imageId,
        imageFile.id,
        imageFile.extension
      )
    );
  }
}
