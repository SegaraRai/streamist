import type { Ref } from 'vue';
import {
  ACCURATE_TIME_CLIENT_CLOCK_CHECK_INTERVAL,
  ACCURATE_TIME_CLIENT_CLOCK_SKEW_THRESHOLD,
  ACCURATE_TIME_IGNORE_PING_THRESHOLD,
  ACCURATE_TIME_INITIAL_PING_DELAY,
  ACCURATE_TIME_PING_INTERVAL,
} from '~/config';
import { defer } from '~/logic/defer';
import { useWS, useWSListener, useWSPongListener } from './useWS';

function _useAccurateTime() {
  const { sendPing$$q } = useWS();

  const diff = ref(0);

  let sending = false;
  const sendPing = (): void => {
    if (sending) {
      return;
    }

    sending = true;
    defer((): void => {
      sending = false;
      sendPing$$q();
    });
  };

  useWSPongListener(({ serverTimestamp$$q, timestamp$$q }): void => {
    const now = Date.now();
    const ping = now - timestamp$$q;

    if (ping < 0 || ping >= ACCURATE_TIME_IGNORE_PING_THRESHOLD) {
      console.warn(
        'accurateTime pong error',
        timestamp$$q,
        serverTimestamp$$q,
        now,
        ping
      );
      return;
    }

    const latency = Math.round(ping / 2);
    const newDiff = serverTimestamp$$q + latency - now;

    console.info(
      'accurateTime pong',
      timestamp$$q,
      serverTimestamp$$q,
      now,
      ping,
      latency,
      newDiff
    );

    diff.value = newDiff;
  });

  useWSListener('connected', (): void => {
    setTimeout(sendPing, ACCURATE_TIME_INITIAL_PING_DELAY);
  });

  useIntervalFn(sendPing, ACCURATE_TIME_PING_INTERVAL);

  let disposing = false;
  tryOnScopeDispose((): void => {
    disposing = true;
  });

  const checkClientClock = (targetTime: number): void => {
    if (disposing) {
      return;
    }

    const timeDiff = Math.abs(targetTime - Date.now());
    if (timeDiff >= ACCURATE_TIME_CLIENT_CLOCK_SKEW_THRESHOLD) {
      console.info(
        'accurateTime client clock skew detected',
        timeDiff,
        diff.value
      );
      sendPing();
    }

    const nextTargetTime =
      Date.now() + ACCURATE_TIME_CLIENT_CLOCK_CHECK_INTERVAL;
    setTimeout(
      checkClientClock,
      ACCURATE_TIME_CLIENT_CLOCK_CHECK_INTERVAL,
      nextTargetTime
    );
  };

  checkClientClock(Date.now());

  return {
    accurateTimeDiff: diff as Readonly<Ref<number>>,
    getAccurateTime: (): number => Date.now() + diff.value,
  };
}

export const useAccurateTime = createSharedComposable(_useAccurateTime);
