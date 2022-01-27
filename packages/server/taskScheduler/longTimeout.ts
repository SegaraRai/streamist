// see https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value
const MAX_DELAY = 2147483647;

export function longTimeout(callback: () => void, timeout: number): () => void {
  const targetTime = Date.now() + timeout;

  let timer: ReturnType<typeof setTimeout>;
  const setTimer = (): void => {
    const delay = Math.min(targetTime - Date.now(), MAX_DELAY);
    timer = setTimeout(delay < MAX_DELAY ? callback : setTimer, delay);
  };
  setTimer();

  return (): void => clearTimeout(timer);
}
