import { _internalSetOS } from './_internal';
import type { ObjectStorageDefinition } from './types';

export function setOS(def: ObjectStorageDefinition): void {
  _internalSetOS(def);
}
