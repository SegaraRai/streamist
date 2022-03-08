import { z } from 'zod';
import { MAX_VOLUME, MIN_VOLUME } from '../config';
import { DeepReadonly } from './_internal/readonly';
import { SessionInfo, zSessionInfo } from './session';
import { zTrackProvider2State } from './trackProvider';

// common types

export const zWSPlaybackState = z.object({
  /** unix time in msec. */
  startedAt: z.number().gte(1),
  /** in sec. */
  startPosition: z.number().gte(0),
  /** in sec. */
  duration: z.number().gte(0),
  playing: z.boolean(),
});

export type WSPlaybackState = DeepReadonly<z.infer<typeof zWSPlaybackState>>;

export const zWSPlaybackTracks = z.intersection(
  zTrackProvider2State,
  z.object({
    setListName: z.string(),
  })
);

export type WSPlaybackTracks = DeepReadonly<z.infer<typeof zWSPlaybackTracks>>;

export const zWSSession = z.object({
  id: z.string(),
  info: zSessionInfo,
  deviceId: z.string(),
  volume: z.number(),
  lastActivatedAt: z.number(),
});

// no need to create schema for this
export interface WSSession {
  id: string;
  info: SessionInfo;
  deviceId: string;
  volume: number;
  lastActivatedAt: number;
}

// no need to create schema for this
export interface WSSessionForResponse extends WSSession {
  readonly host: boolean;
  readonly you: boolean;
}

// requests

export const zWSRequestSetSession = z.object({
  type: z.literal('setSession'),
  activate: z.optional(z.boolean()),
  info: z.optional(zSessionInfo),
  deviceId: z.optional(z.string()),
  volume: z.optional(z.number()),
  volumeUnmuted: z.optional(z.number()),
});

export type WSRequestSetSession = DeepReadonly<
  z.infer<typeof zWSRequestSetSession>
>;

export const zWSRequestSetState = z.object({
  type: z.literal('setState'),
  host: z.optional(z.union([z.string(), z.literal(true)])),
  tracks: z.optional(zWSPlaybackTracks),
  trackChange: z.optional(z.boolean()),
  state: z.optional(zWSPlaybackState),
  volume: z.optional(z.number().gte(MIN_VOLUME).lte(MAX_VOLUME)),
  volumeUnmuted: z.optional(z.number().gt(MIN_VOLUME).lte(MAX_VOLUME)),
});

export type WSRequestSetState = DeepReadonly<
  z.infer<typeof zWSRequestSetState>
>;

export const zWSRequest = z.union([zWSRequestSetSession, zWSRequestSetState]);

export type WSRequest = DeepReadonly<z.infer<typeof zWSRequest>>;

// responses
// no need to create schema for these types

export interface WSResponseConnected {
  readonly type: 'connected';
  readonly sessions: readonly WSSessionForResponse[];
  readonly pbTracks: WSPlaybackTracks | null;
  readonly pbState: WSPlaybackState | null;
}

export interface WSResponseUpdated {
  readonly type: 'updated';
  readonly byHost: boolean;
  readonly byYou: boolean;
  readonly sessions?: readonly WSSessionForResponse[];
  readonly pbTracks?: WSPlaybackTracks | null;
  readonly pbTrackChange?: boolean;
  readonly pbState?: WSPlaybackState | null;
}

export type WSResponse = WSResponseConnected | WSResponseUpdated;
