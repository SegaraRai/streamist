let pwaStarted = false;

export function setPWAStarted(): void {
  pwaStarted = true;
}

export function isPWAStarted(): boolean {
  return pwaStarted;
}
