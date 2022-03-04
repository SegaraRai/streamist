import type { RepeatType } from './playback';

export type TrackId = string;

export interface TrackProviderState {
  readonly repeat: RepeatType;
  readonly shuffle: boolean;
  readonly currentTrack: TrackId | null;
  readonly queue: readonly TrackId[];
  readonly repeatQueue: readonly TrackId[];
  readonly history: readonly TrackId[];
  readonly setList: readonly TrackId[];
}

export interface TrackProvider2State extends TrackProviderState {
  readonly playNextQueue: readonly TrackId[];
  readonly playNextHistory: readonly TrackId[];
  readonly currentTrackOverride: TrackId | null;
}
