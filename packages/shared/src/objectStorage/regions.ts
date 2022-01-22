import { _internalGetRegionSet, _internalGetRegions } from './_internal';
import type { OSRegion } from './types';

export function getOSRegions(): readonly OSRegion[] {
  const regions = _internalGetRegions();
  if (!regions) {
    throw new Error('getOSRegions: buckets not defined');
  }
  return regions;
}

export function isValidOSRegion(region: unknown): region is OSRegion {
  const regionSet = _internalGetRegionSet();
  if (!regionSet) {
    throw new Error('isValidOSRegion: buckets not defined');
  }
  if (typeof region !== 'string') {
    return false;
  }
  return regionSet.has(region);
}

export function toOSRegion(region: string): OSRegion {
  if (!isValidOSRegion(region)) {
    throw new Error(`toOSRegion: invalid region: ${region}`);
  }
  return region;
}
