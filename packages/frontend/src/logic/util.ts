import type { Track } from '$prisma/client';

export function calcTrackListHeight(
  tracks: readonly Readonly<Track>[],
  showDiscNumber: boolean
): number {
  const useDiscNumber =
    showDiscNumber && tracks.some((track) => track.discNumber !== 1);
  let height = 30 + 1;
  if (useDiscNumber) {
    height += Math.max(...tracks.map((track) => track.discNumber)) * (30 + 1);
  }
  height += tracks.length * (48 + 1) - 1;
  return height;
}

export function calcTrackTableHeight(
  tracks: readonly Readonly<Track>[],
  showDiscNumber: boolean
): number {
  const useDiscNumber =
    showDiscNumber && tracks.some((track) => track.discNumber !== 1);
  let height = 48 + 1 + 1;
  if (useDiscNumber) {
    height += Math.max(...tracks.map((track) => track.discNumber)) * (34 + 1);
  }
  height += tracks.length * (48 + 1) - 1;
  return height;
}
