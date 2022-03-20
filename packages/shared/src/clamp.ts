export function clamp(value: number, max = 1, min = 0): number {
  return Math.max(Math.min(value, max), min);
}
