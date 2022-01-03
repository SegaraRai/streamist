const K = 2;
const R = 100;

const K_INV = 1 / K;
const R_INV = 1 / R;

export function realVolumeToVisualVolume(volume: number): number {
  return Math.round(Math.min(Math.max(Math.pow(volume, K_INV) * R, 0), R));
}

export function visualVolumeToRealVolume(volume: number): number {
  return Math.min(Math.max(Math.pow(volume * R_INV, K), 0), 1);
}
