import type { OSRegion } from './types';

let gRegions: readonly OSRegion[] | undefined;
let gRegionSet: ReadonlySet<OSRegion> | undefined;

export function _internalSetRegions(regions: readonly OSRegion[]): void {
  if (gRegions) {
    throw new Error('internalSetOS: regions already defined');
  }

  gRegions = [...regions];
  gRegionSet = new Set(regions);
}

export function _internalGetRegions(): readonly OSRegion[] | undefined {
  return gRegions;
}

export function _internalGetRegionSet(): ReadonlySet<string> | undefined {
  return gRegionSet;
}
