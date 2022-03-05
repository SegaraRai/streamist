export function defer(callback: () => void): void {
  if (typeof window.requestIdleCallback === 'function') {
    requestIdleCallback(callback);
  } else if (typeof window.requestAnimationFrame === 'function') {
    requestAnimationFrame(callback);
  } else if (typeof window.queueMicrotask === 'function') {
    queueMicrotask(callback);
  } else {
    Promise.resolve().then(callback);
  }
}
