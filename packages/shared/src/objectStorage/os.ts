import { _internalGetOSDef } from './_internal';
import type { OSRegion, ObjectStorage, ObjectStorageRegion } from './types';

export function getOSRegion(region: OSRegion): ObjectStorageRegion {
  const def = _internalGetOSDef();
  if (!def) {
    throw new Error(`getOSRegion: buckets not defined`);
  }
  const regionDef = def[region];
  if (!regionDef) {
    throw new Error(`getOSRegion: region ${region} not defined`);
  }
  return regionDef;
}

export function getSourceFileOS(region: OSRegion): ObjectStorage {
  return getOSRegion(region).buckets.sourceFile;
}

export function getTranscodedAudioFileOS(region: OSRegion): ObjectStorage {
  return getOSRegion(region).buckets.transcodedAudioFile;
}

export function getTranscodedImageFileOS(region: OSRegion): ObjectStorage {
  return getOSRegion(region).buckets.transcodedImageFile;
}

export function getTranscodeLogFileOS(region: OSRegion): ObjectStorage {
  return getOSRegion(region).buckets.transcodeLog;
}
