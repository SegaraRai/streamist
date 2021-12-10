import type { Track, TrackFile } from '$prisma/client';

export interface TrackWithFile extends Track {
  files: TrackFile[];
}
