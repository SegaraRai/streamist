import { Actor, Durable } from 'worktop/cfw.durable';
import type { WebSocket } from 'worktop/cfw.ws';
import type {
  WSPlaybackState,
  WSPlaybackTracks,
  WSRequest,
  WSResponse,
  WSSession,
  WSSessionForResponse,
} from '$shared/types';
import { zWSRequest } from '$shared/validations';
import type { DORequestData, WSBindings } from './types';

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

interface WSSessionWithWS extends Mutable<WSSession> {
  readonly ws: WebSocket;
}

function send(ws: WebSocket, data: WSResponse): void {
  try {
    ws.send(JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

/**
 * per-user durable object
 */
export class DO extends Actor {
  readonly state!: Durable.State;
  readonly bindings!: WSBindings;

  readonly sessions: WSSessionWithWS[] = [];
  hostWS: WebSocket | null = null;

  pbState: WSPlaybackState | null = null;
  pbTracks: WSPlaybackTracks | null = null;

  private listSessions(ws: WebSocket): WSSessionForResponse[] {
    return this.sessions.map((s) => ({
      you: s.ws === ws,
      host: s.ws === this.hostWS,
      id: s.id,
      deviceId: s.deviceId,
      info: s.info,
      volume: s.volume,
      lastActivatedAt: s.lastActivatedAt,
    }));
  }

  private onPingMessage(ws: WebSocket, data: string) {
    try {
      ws.send(`pong:${data.slice(5)}:${Date.now()}`);
    } catch (e) {
      console.error(e);
    }
  }

  private onMessage(ws: WebSocket, data: WSRequest): void {
    const senderSession = this.sessions.find((session) => session.ws === ws);
    if (!senderSession) {
      console.error('session not found');
      return;
    }

    let hostSession = this.sessions.find(
      (session) => session.ws === this.hostWS
    );
    let isHost = hostSession?.ws === ws;

    let activated = false;
    let modifiedSessions = false;
    let modifiedState = false;
    let modifiedTracks = false;
    let trackChange = false;

    switch (data.type) {
      case 'setSession':
        senderSession.lastActivatedAt = Date.now();
        if (data.activate) {
          activated = true;
        }
        if (data.info) {
          senderSession.info = data.info;
        }
        if (data.deviceId) {
          senderSession.deviceId = data.deviceId;
        }
        if (data.volume != null) {
          senderSession.volume = data.volume;
        }
        modifiedSessions = true;
        break;

      case 'setState': {
        senderSession.lastActivatedAt = Date.now();
        if (data.host) {
          const newHostSession =
            data.host === true
              ? senderSession
              : this.sessions.find((s) => s.id === data.host);
          if (newHostSession) {
            this.hostWS = newHostSession.ws;
            hostSession = newHostSession;
            isHost = newHostSession.ws === senderSession.ws;
          }
        }
        if (data.state) {
          this.pbState = data.state;
          if (this.pbState) {
            if (!this.hostWS) {
              (this.pbState as Mutable<WSPlaybackState>).playing = false;
            }
            (this.pbState as Mutable<WSPlaybackState>).startPosition = Math.max(
              Math.min(this.pbState.startPosition, this.pbState.duration),
              0
            );
          }
          modifiedState = true;
        }
        if (data.tracks) {
          this.pbTracks = data.tracks;
          trackChange = data.trackChange || false;
          modifiedTracks = true;
          if (
            !this.pbTracks.currentTrack &&
            !this.pbTracks.currentTrackOverride &&
            this.pbState
          ) {
            this.pbState = null;
            modifiedState = true;
          }
        }
        if (data.volume != null) {
          if (hostSession) {
            hostSession.volume = data.volume;
          }
        }
        modifiedSessions = true;
        break;
      }
    }

    if (activated && !isHost) {
      // send current state
      send(ws, {
        type: 'updated',
        byHost: false,
        byYou: true,
        pbState: this.pbState,
        pbTracks: this.pbTracks,
        pbTrackChange: true,
        sessions: modifiedSessions ? this.listSessions(ws) : undefined,
      });
    }

    if (modifiedState || modifiedTracks || modifiedSessions) {
      for (const session of this.sessions) {
        if (session.ws === ws && activated && !isHost) {
          continue;
        }

        send(session.ws, {
          type: 'updated',
          byHost: ws === this.hostWS,
          byYou: session.ws === ws,
          pbState: modifiedState ? this.pbState : undefined,
          pbTracks: modifiedTracks ? this.pbTracks : undefined,
          pbTrackChange: modifiedTracks ? trackChange : undefined,
          sessions: modifiedSessions
            ? this.listSessions(session.ws)
            : undefined,
        });
      }
    }
  }

  private onClose(ws: WebSocket): void {
    // TODO: keep durable object alive for seconds when there are no sessions

    const isHost = this.hostWS === ws;

    this.sessions.splice(
      this.sessions.findIndex((session) => session.ws === ws),
      1
    );

    let stateUpdated = false;

    if (isHost) {
      // host disconnected
      this.hostWS = null;

      // pause
      if (this.pbState?.playing) {
        stateUpdated = true;
        this.pbState = {
          playing: false,
          duration: this.pbState.duration,
          startPosition: Math.min(
            Math.max(
              this.pbState.startPosition +
                (Date.now() - this.pbState.startedAt) / 1000,
              0
            ),
            this.pbState.duration
          ),
          startedAt: Date.now(),
        };
      }
    }

    for (const session of this.sessions) {
      send(session.ws, {
        type: 'updated',
        byHost: false,
        byYou: false,
        sessions: this.listSessions(session.ws),
        pbState: stateUpdated ? this.pbState : undefined,
      });
    }
  }

  override setup(state: Durable.State, bindings: WSBindings): void {
    (this.state as Durable.State) = state;
    (this.bindings as WSBindings) = bindings;
  }

  override onconnect(req: Request, ws: WebSocket): void {
    // TODO: volume
    const strRequestData = req.headers.get('Streamist-DO-Request-Data');
    if (!strRequestData) {
      ws.close(4001, 'no request data');
      console.error('no request data');
      return;
    }

    const { deviceId, host, info } = JSON.parse(
      decodeURIComponent(strRequestData)
    ) as DORequestData;

    const id = crypto.randomUUID();

    this.sessions.push({
      ws,
      id,
      deviceId,
      info,
      lastActivatedAt: Date.now(),
      volume: 100,
    });

    if (host) {
      this.hostWS = ws;
    }

    try {
      ws.addEventListener('message', (event): void => {
        if (typeof event.data !== 'string') {
          return;
        }

        try {
          if (event.data.startsWith('ping:')) {
            this.onPingMessage(ws, event.data);
          } else {
            const data = zWSRequest.parse(JSON.parse(event.data));
            this.onMessage(ws, data);
          }
        } catch (e) {
          console.error(e);
        }
      });

      ws.addEventListener('close', (): void => {
        this.onClose(ws);
      });
    } catch (e) {
      console.error(e);
      try {
        ws.close();
      } catch (e2) {
        console.error(e2);
      }
      this.onClose(ws);
    }

    for (const session of this.sessions) {
      if (session.ws === ws) {
        continue;
      }
      send(session.ws, {
        type: 'updated',
        byHost: false,
        byYou: false,
        sessions: this.listSessions(session.ws),
      });
    }

    send(ws, {
      type: 'connected',
      sessions: this.listSessions(ws),
      pbState: this.pbState,
      pbTracks: this.pbTracks,
    });
  }

  async receive(req: Request): Promise<Response> {
    try {
      return await this.connect(req);
    } catch (e) {
      console.error(e);
      return new Response('500', {
        status: 500,
      });
    }
  }
}
