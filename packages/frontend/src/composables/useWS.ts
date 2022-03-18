import {
  WS_PROTOCOL,
  WS_QUERY_PARAM_DEVICE_CLIENT,
  WS_QUERY_PARAM_DEVICE_ID,
  WS_QUERY_PARAM_DEVICE_NAME,
  WS_QUERY_PARAM_DEVICE_PLATFORM,
  WS_QUERY_PARAM_DEVICE_TYPE,
  WS_QUERY_PARAM_HOST,
  WS_TOKEN_PROTOCOL_PREFIX,
} from '$shared/config';
import type {
  WSRequest,
  WSRequestSetSession,
  WSRequestSetState,
  WSResponse,
  WSResponseConnected,
  WSResponseUpdated,
  WSSessionForResponse,
} from '$shared/types';
import { SEND_ACTIVATE_EVENT_THROTTLE } from '~/config';
import { generateDeviceId } from '~/logic/deviceId';
import { getUserId, tokens } from '~/logic/tokens';
import { useSessionInfo } from '~/stores/sessionInfo';

export interface WSPong {
  readonly timestamp$$q: number;
  readonly serverTimestamp$$q: number;
}

type Callback<T> = (data: T) => void;

function _useWS() {
  let closing = false;
  let ws: WebSocket | undefined;

  let pendingRequestSetSession: WSRequestSetSession | undefined;
  let pendingRequestSetState: WSRequestSetState | undefined;

  const pongCallbacks: Callback<WSPong>[] = [];
  const callbacks: (readonly [
    type: WSResponse['type'],
    callback: Callback<any>
  ])[] = [];

  const deviceId = useLocalStorage('deviceId', generateDeviceId());
  const { sessionInfo } = useSessionInfo();

  const setupWebSocket = (): void => {
    if (ws || closing) {
      return;
    }

    const userId = getUserId();
    if (!userId) {
      return;
    }

    const wsToken = tokens.value?.wsToken;
    if (!wsToken) {
      return;
    }

    const searchParams = new URLSearchParams([
      [WS_QUERY_PARAM_HOST, sessionType.value === 'host' ? '1' : '0'],
      [WS_QUERY_PARAM_DEVICE_ID, deviceId.value],
      [WS_QUERY_PARAM_DEVICE_TYPE, sessionInfo.value.type],
      [WS_QUERY_PARAM_DEVICE_PLATFORM, sessionInfo.value.platform],
      [WS_QUERY_PARAM_DEVICE_CLIENT, sessionInfo.value.client],
      [WS_QUERY_PARAM_DEVICE_NAME, sessionInfo.value.name],
    ]);

    ws = new WebSocket(
      `${import.meta.env.MODE === 'development' ? 'ws' : 'wss'}://${
        location.host
      }/ws/channels/${userId}?${searchParams}`,
      [WS_PROTOCOL, `${WS_TOKEN_PROTOCOL_PREFIX}${wsToken}`]
    );

    ws.onerror = (): void => {
      ws?.close();
      ws = undefined;
      setTimeout(setupWebSocket, 1000);
    };

    ws.onclose = (): void => {
      ws = undefined;
      setTimeout(setupWebSocket, 1000);
    };

    ws.onopen = (): void => {
      sendPendingRequests();
    };

    ws.onmessage = (event): void => {
      if (typeof event.data !== 'string') {
        return;
      }

      if (event.data.startsWith('pong:')) {
        const [, strTimestamp, strServerTimestamp] = event.data.split(':');
        const pong: WSPong = {
          timestamp$$q: parseInt(strTimestamp, 10),
          serverTimestamp$$q: parseInt(strServerTimestamp, 10),
        };
        for (const cb of pongCallbacks) {
          cb(pong);
        }
        return;
      }

      const data = JSON.parse(event.data) as WSResponse;
      const { type } = data;
      for (const [t, cb] of callbacks) {
        if (t === type) {
          cb(data);
        }
      }
    };
  };

  const sendWS = (data: WSRequest, resend = false): void => {
    // TODO: queue data and send when connection is ready
    let sent = false;
    try {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
        sent = true;
      }
    } catch (e) {
      console.error(e, data);
    }
    if (!sent && resend) {
      // we do not resend ping request
      switch (data.type) {
        case 'setSession':
          pendingRequestSetSession = {
            ...pendingRequestSetSession,
            ...data,
          };
          break;

        case 'setState':
          pendingRequestSetState = {
            ...pendingRequestSetState,
            ...data,
          };
          break;
      }
    }
  };

  const sendPendingRequests = (): void => {
    if (ws?.readyState === WebSocket.OPEN) {
      if (pendingRequestSetSession) {
        ws.send(JSON.stringify(pendingRequestSetSession));
        pendingRequestSetSession = undefined;
      }
      if (pendingRequestSetState) {
        ws.send(JSON.stringify(pendingRequestSetState));
        pendingRequestSetState = undefined;
      }
    }
  };

  const findCallbackIndex = (type: string, callback: Callback<any>): number =>
    callbacks.findIndex(([t, c]) => t === type && c === callback);

  const sendActivatedThrottled = useThrottleFn(
    (): void => {
      sendWS({
        type: 'setSession',
        activate: true,
      });
    },
    SEND_ACTIVATE_EVENT_THROTTLE,
    false
  );

  //

  tryOnScopeDispose((): void => {
    closing = true;
    ws?.close(1000);
    ws = undefined;
  });

  watch([deviceId, sessionInfo], ([newDeviceId, newSessionInfo]): void => {
    sendWS(
      {
        type: 'setSession',
        deviceId: newDeviceId,
        info: newSessionInfo,
      },
      true
    );
  });

  useEventListener('focus', sendActivatedThrottled);
  useEventListener(document, 'visibilitychange', (): void => {
    if (document.visibilityState === 'visible') {
      sendActivatedThrottled();
    }
  });

  //

  const sessions = ref<readonly WSSessionForResponse[]>([]);
  const currentSession = computedEager(() =>
    sessions.value.find((session) => session.you)
  );
  const hostSession = computedEager(() =>
    sessions.value.find((session) => session.host)
  );
  const sessionType = computedEager(() => {
    const host = hostSession.value;
    return !host
      ? 'none'
      : host.you
      ? 'host'
      : host.deviceId === deviceId.value
      ? 'hostSibling'
      : 'guest';
  });

  callbacks.push(
    [
      'connected',
      (data: WSResponseConnected): void => {
        sessions.value = data.sessions;
      },
    ],
    [
      'updated',
      (data: WSResponseUpdated): void => {
        if (data.sessions) {
          sessions.value = data.sessions;
        }
      },
    ]
  );

  //

  tokens.renew().then((): void => {
    setupWebSocket();
  });

  return {
    deviceId$$q: deviceId,
    sessions$$q: sessions as Readonly<typeof sessions>,
    currentSession$$q: currentSession,
    hostSession$$q: hostSession,
    sessionType$$q: sessionType,
    sendWS$$q: sendWS,
    sendPing$$q: (timestamp = Date.now()) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(`ping:${timestamp}`);
      }
    },
    setHost$$q: (id?: string): void => {
      sendWS(
        {
          type: 'setState',
          host: id || true,
        },
        true
      );
    },
    addWSListener$$q: <T extends WSResponse['type']>(
      type: T,
      callback: Callback<WSResponse & { type: T }>
    ): void => {
      const callbackIndex = findCallbackIndex(type, callback);
      if (callbackIndex === -1) {
        callbacks.push([type, callback]);
      }
    },
    removeWSListener$$q: <T extends WSResponse['type']>(
      type: T,
      callback: Callback<WSResponse & { type: T }>
    ): void => {
      const callbackIndex = findCallbackIndex(type, callback);
      if (callbackIndex !== -1) {
        callbacks.splice(callbackIndex, 1);
      }
    },
    addWSPongListener$$q: (callback: Callback<WSPong>): void => {
      const callbackIndex = pongCallbacks.indexOf(callback);
      if (callbackIndex === -1) {
        pongCallbacks.push(callback);
      }
    },
    removeWSPongListener$$q: (callback: Callback<WSPong>): void => {
      const callbackIndex = pongCallbacks.indexOf(callback);
      if (callbackIndex !== -1) {
        callbacks.splice(callbackIndex, 1);
      }
    },
  };
}

export const useWS = createSharedComposable(_useWS);

export function useWSListener<T extends WSResponse['type']>(
  type: T,
  callback: Callback<WSResponse & { readonly type: T }>
): void {
  const { addWSListener$$q, removeWSListener$$q } = useWS();

  addWSListener$$q(type, callback as Callback<any>);

  tryOnScopeDispose((): void => {
    removeWSListener$$q(type, callback as Callback<any>);
  });
}

export function useWSPongListener(callback: Callback<WSPong>): void {
  const { addWSPongListener$$q, removeWSPongListener$$q } = useWS();

  addWSPongListener$$q(callback);

  tryOnScopeDispose((): void => {
    removeWSPongListener$$q(callback);
  });
}
