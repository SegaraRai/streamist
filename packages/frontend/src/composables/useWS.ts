import { WSRequest, WSResponse } from '$shared/types';
import { generateDeviceId } from '~/logic/deviceId';
import { getUserId, tokens } from '~/logic/tokens';
import { useSessionInfo } from '~/stores/sessionInfo';

type Callback<T> = (data: T) => void;

function _useWS() {
  let closing = false;
  let ws: WebSocket | undefined;

  const sendQueue: WSRequest[] = [];
  const callbacks: (readonly [type: string, callback: Callback<any>])[] = [];

  const host = ref(false);
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
      ['host', host ? '1' : '0'],
      ['d_id', deviceId.value],
      ['d_type', sessionInfo.value.type],
      ['d_platform', sessionInfo.value.platform],
      ['d_client', sessionInfo.value.client],
      ['d_name', sessionInfo.value.name],
    ]);

    ws = new WebSocket(
      `${import.meta.env.MODE === 'development' ? 'ws' : 'wss'}://${
        location.host
      }/ws/channels/${userId}?${searchParams}`,
      `token~${wsToken}`
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
      sendQueueMessages();
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
      sendQueue.push(...data);
    }
  };

  const sendQueueMessages = (): void => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(sendQueue));
      sendQueue.splice(0, sendQueue.length);
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

  tokens.renew().then((): void => {
    setupWebSocket();
  });

  return {
    deviceId,
    sendWS,
    addWSListener: <T extends WSResponse['type']>(
      type: T,
      callback: Callback<WSResponse & { type: T }>
    ): void => {
      const callbackIndex = findCallbackIndex(type, callback);
      if (callbackIndex === -1) {
        callbacks.push([type, callback]);
      }
    },
    removeWSListener: <T extends WSResponse['type']>(
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
  const { addWSListener, removeWSListener } = useWS();

  addWSListener(type, callback as Callback<any>);

  tryOnScopeDispose((): void => {
    removeWSListener(type, callback as Callback<any>);
  });
}
