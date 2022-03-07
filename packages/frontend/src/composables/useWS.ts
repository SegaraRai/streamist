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
  WSResponse,
  WSResponseConnected,
  WSResponseUpdated,
  WSSessionForResponse,
} from '$shared/types';
import { generateDeviceId } from '~/logic/deviceId';
import { getUserId, tokens } from '~/logic/tokens';
import { useSessionInfo } from '~/stores/sessionInfo';

type Callback<T> = (data: T) => void;

function _useWS() {
  let closing = false;
  let ws: WebSocket | undefined;

  const pendingRequests: WSRequest[] = [];
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
      sendQueuedRequests();
    };

    ws.onmessage = (event): void => {
      if (typeof event.data !== 'string') {
        return;
      }

      const dataList = JSON.parse(event.data) as readonly WSResponse[];
      for (const data of dataList) {
        const { type } = data;
        for (const [t, cb] of callbacks) {
          if (t === type) {
            cb(data);
          }
        }
      }
    };
  };

  const sendWS = (data: readonly WSRequest[], resend = false): void => {
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
      pendingRequests.push(...data);
    }
  };

  const sendQueuedRequests = (): void => {
    if (pendingRequests.length > 0 && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(pendingRequests));
      pendingRequests.splice(0, pendingRequests.length);
    }
  };

  const findCallbackIndex = (type: string, callback: Callback<any>): number =>
    callbacks.findIndex(([t, c]) => t === type && c === callback);

  //

  tryOnScopeDispose((): void => {
    closing = true;
    ws?.close(1000);
    ws = undefined;
  });

  watch([deviceId, sessionInfo], ([newDeviceId, newSessionInfo]): void => {
    sendWS(
      [
        {
          type: 'updateSession',
          deviceId: newDeviceId,
          info: newSessionInfo,
        },
      ],
      true
    );
  });

  useEventListener('focus', (): void => {
    sendWS([
      {
        type: 'activate',
      },
    ]);
  });

  //

  const sessions = ref<readonly WSSessionForResponse[]>([]);
  const currentSession = eagerComputed(() =>
    sessions.value.find((session) => session.you)
  );
  const hostSession = eagerComputed(() =>
    sessions.value.find((session) => session.host)
  );
  const sessionType = eagerComputed(() => {
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
    setHost$$q: (id?: string): void => {
      sendWS(
        [
          {
            type: 'setHost',
            id,
          },
        ],
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
