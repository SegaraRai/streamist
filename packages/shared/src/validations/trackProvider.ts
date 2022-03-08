import { z } from 'zod';
import type { DeepReadonly } from './_internal/readonly';
import { zRepeatType } from './playback';

export const zTrackId = z.string().min(1);

export type TrackId = string;

export const zTrackProviderState = z.object({
  repeat: zRepeatType,
  shuffle: z.boolean(),
  currentTrack: zTrackId.nullable(),
  queue: z.array(zTrackId),
  repeatQueue: z.array(zTrackId),
  history: z.array(zTrackId),
  setList: z.array(zTrackId),
});

export type TrackProviderState = DeepReadonly<
  z.infer<typeof zTrackProviderState>
>;

export const zTrackProvider2State = z.intersection(
  zTrackProviderState,
  z.object({
    currentTrackOverride: zTrackId.nullable(),
    playNextQueue: z.array(zTrackId),
    playNextHistory: z.array(zTrackId),
  })
);

export type TrackProvider2State = DeepReadonly<
  z.infer<typeof zTrackProvider2State>
>;
