import type { SessionInfo } from './session';
import type { TrackProvider2State } from './trackProvider';

export interface WSPlaybackState {
  /** unix time in msec. */
  readonly startedAt: number;
  /** in sec. */
  readonly startPosition: number;
  /** in sec. */
  readonly duration: number;
  /** paused or playing */
  readonly playing: boolean;
}

export interface WSPlaybackTracks extends TrackProvider2State {
  readonly setListName: string;
}

export interface WSSession {
  readonly id: string;
  readonly info: SessionInfo;
  readonly deviceId: string;
  readonly volume: number;
  readonly lastActivatedAt: number;
}

export interface WSSessionForResponse extends WSSession {
  readonly host: boolean;
  readonly you: boolean;
}

// requests

export interface WSRequestPing {
  readonly type: 'ping';
  readonly timestamp: number;
}

export interface WSRequestActivate {
  readonly type: 'activate';
}

export interface WSRequestUpdateSession {
  readonly type: 'updateSession';
  readonly info?: SessionInfo;
  readonly deviceId?: string;
  readonly volume?: number;
  readonly volumeUnmuted?: number;
}

export interface WSRequestSetHost {
  readonly type: 'setHost';
  readonly id?: string;
}

export interface WSRequestSetTracks {
  readonly type: 'setTracks';
  readonly tracks: WSPlaybackTracks;
  readonly trackChange: boolean;
}

export interface WSRequestSetVolume {
  readonly type: 'setVolume';
  readonly volume: number;
}

export interface WSRequestPlay {
  readonly type: 'play';
  readonly timestamp: number;
  readonly position: number;
  readonly duration: number;
}

export interface WSRequestPause {
  readonly type: 'pause';
  readonly timestamp: number;
  readonly position: number;
  readonly duration: number;
}

export type WSRequest =
  | WSRequestPing
  | WSRequestActivate
  | WSRequestUpdateSession
  | WSRequestSetHost
  | WSRequestSetTracks
  | WSRequestSetVolume
  | WSRequestPlay
  | WSRequestPause;

// responses

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
