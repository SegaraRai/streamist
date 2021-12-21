export function isJWTNotExpired(token: string, tolerance = 0): boolean {
  const strPayload = token.split('.')[1];
  const payload = JSON.parse(window.atob(strPayload));
  const now = Date.now() / 1000 - tolerance;
  return payload.exp > now;
}
