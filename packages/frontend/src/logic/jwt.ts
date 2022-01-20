export interface JWTPayload {
  id: string;
  sub: string;
  exp: number;
  aud: string;
  iss: string;
}

function parseJWTPayload(token: string): JWTPayload {
  const strPayload = token.split('.')[1];
  const payload = JSON.parse(window.atob(strPayload)) as JWTPayload;
  return payload;
}

export function isJWTExpired(token: string, tolerance = 0): boolean {
  const payload = parseJWTPayload(token);
  const now = Date.now() / 1000 - tolerance;
  return payload.exp <= now;
}

export function extractSubFromJWT(token: string): string {
  return parseJWTPayload(token).sub;
}
