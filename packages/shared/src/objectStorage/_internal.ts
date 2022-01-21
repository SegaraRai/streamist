import { ObjectStorageDefinition, ObjectStorageRegion } from './types';

let gObjectStorageDefinition: ObjectStorageDefinition | undefined;
let gRegions: readonly ObjectStorageRegion[] | undefined;
let gRegionSet: ReadonlySet<string> | undefined;

export function _internalSetOS(def: ObjectStorageDefinition): void {
  if (gObjectStorageDefinition) {
    throw new Error('internalSetOS: buckets already defined');
  }

  gObjectStorageDefinition = { ...def };
  gRegions = Object.values(gObjectStorageDefinition);
  gRegionSet = new Set(Object.keys(gObjectStorageDefinition));
}

export function _internalGetOSDef(): ObjectStorageDefinition | undefined {
  return gObjectStorageDefinition;
}

export function _internalGetRegions():
  | readonly ObjectStorageRegion[]
  | undefined {
  return gRegions;
}

export function _internalGetRegionSet(): ReadonlySet<string> | undefined {
  return gRegionSet;
}
