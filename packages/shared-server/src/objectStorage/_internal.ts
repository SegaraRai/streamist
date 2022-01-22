import { getOSRegions } from '$shared/objectStorage';
import { ObjectStorageDefinition } from './types';

let gObjectStorageDefinition: ObjectStorageDefinition | undefined;

export function _internalSetOS(def: ObjectStorageDefinition): void {
  if (gObjectStorageDefinition) {
    throw new Error('internalSetOS: buckets already defined');
  }

  const predefinedRegions = [...getOSRegions()].sort().join('/');
  const providedRegions = [...Object.keys(def)].sort().join('/');
  if (providedRegions !== predefinedRegions) {
    throw new Error(
      `internalSetOS: provided regions do not match predefined regions (provided: ${providedRegions}, predefined: ${predefinedRegions})`
    );
  }

  gObjectStorageDefinition = { ...def };
}

export function _internalGetOSDef(): ObjectStorageDefinition | undefined {
  return gObjectStorageDefinition;
}
