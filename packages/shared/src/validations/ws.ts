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

export const zWSRequestPing = z.object({
  type: z.literal('ping'),
  timestamp: z.number(),
});

export type WSRequestPing = DeepReadonly<z.infer<typeof zWSRequestPing>>;

export const zWSRequestActivate = z.object({
  type: z.literal('activate'),
});

export type WSRequestActivate = DeepReadonly<
  z.infer<typeof zWSRequestActivate>
>;

export const zWSRequestUpdateSession = z.object({
  type: z.literal('updateSession'),
  info: z.optional(zSessionInfo),
  deviceId: z.optional(z.string()),
  volume: z.optional(z.number()),
  volumeUnmuted: z.optional(z.number()),
});

export type WSRequestUpdateSession = DeepReadonly<
  z.infer<typeof zWSRequestUpdateSession>
>;

export const zWSRequestSetHost = z.object({
  type: z.literal('setHost'),
  id: z.optional(z.string()),
});

export type WSRequestSetHost = z.infer<typeof zWSRequestSetHost>;

export const zWSRequestSetTracks = z.object({
  type: z.literal('setTracks'),
  tracks: zWSPlaybackTracks,
  trackChange: z.boolean(),
});

export type WSRequestSetTracks = DeepReadonly<
  z.infer<typeof zWSRequestSetTracks>
>;

export const zWSRequestSetVolume = z.object({
  type: z.literal('setVolume'),
  volume: z.number().gte(MIN_VOLUME).lte(MAX_VOLUME),
  volumeUnmuted: z.number().gt(MIN_VOLUME).lte(MAX_VOLUME),
});

export type WSRequestSetVolume = DeepReadonly<
  z.infer<typeof zWSRequestSetVolume>
>;

export const zWSRequestSetState = z.object({
  type: z.literal('setState'),
  timestamp: z.number().gte(1),
  position: z.number().gte(0),
  duration: z.number().gte(0),
  playing: z.boolean(),
});

export type WSRequestSetState = DeepReadonly<
  z.infer<typeof zWSRequestSetState>
>;

export const zWSRequest = z.union([
  zWSRequestPing,
  zWSRequestActivate,
  zWSRequestUpdateSession,
  zWSRequestSetHost,
  zWSRequestSetTracks,
  zWSRequestSetVolume,
  zWSRequestSetState,
]);

export type WSRequest = DeepReadonly<z.infer<typeof zWSRequest>>;

export const zWSRequests = z.array(zWSRequest);

// responses
// no need to create schema for these types

export interface WSResponsePong {
  readonly type: 'pong';
  readonly timestamp: number;
  readonly serverTimestamp: number;
}

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

export type WSResponse =
  | WSResponsePong
  | WSResponseConnected
  | WSResponseUpdated;
