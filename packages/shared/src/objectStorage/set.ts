import { _internalSetRegions } from './_internal';
import type { OSRegion } from './types';

export function setOSRegions(regions: readonly OSRegion[]): void {
  _internalSetRegions(regions);
}
