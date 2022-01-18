import { CoArtistRole, isBuiltinCoArtistRole } from '$shared/coArtist';

export function roleToText(
  role: CoArtistRole,
  t: (text: string, n?: number) => string,
  prefix = 'coArtist.role.',
  n?: number
): string {
  return isBuiltinCoArtistRole(role) ? t(`${prefix}${role}`, n) : role.slice(1);
}
