import { clamp } from '$shared/clamp';
import { MAX_VOLUME, VOLUME_EXP_FACTOR } from '$shared/config';

const K = VOLUME_EXP_FACTOR;
const R = MAX_VOLUME;

const K_INV = 1 / K;
const R_INV = 1 / R;

export function realVolumeToVisualVolume(volume: number): number {
  return Math.round(clamp(Math.pow(volume, K_INV) * R, R));
}

export function visualVolumeToRealVolume(volume: number): number {
  return clamp(Math.pow(volume * R_INV, K));
}
