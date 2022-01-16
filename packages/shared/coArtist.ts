import { normalizeTextForSingleLine } from './normalize';

export const CO_ARTIST_ROLE_PREFIX_BUILTIN = '#' as const;
export const CO_ARTIST_ROLE_PREFIX_USER_DEFINED = '=' as const;

export const builtinCoArtistRoles = [
  'artist',
  'vocal',
  'arranger',
  'composer',
  'lyricist',
  'producer',
] as const;

export type BuiltinCoArtistRole = typeof builtinCoArtistRoles[number];

const builtinCoArtistRoleSet: ReadonlySet<string> = new Set(
  builtinCoArtistRoles
);

export type CoArtistRole =
  | `${typeof CO_ARTIST_ROLE_PREFIX_BUILTIN}${BuiltinCoArtistRole}`
  | `${typeof CO_ARTIST_ROLE_PREFIX_USER_DEFINED}${string}`;

export function isValidUserDefinedCoArtistRole(text: string): boolean {
  return text.length > 0 && text === normalizeTextForSingleLine(text);
}

export function isValidCoArtistRole(
  coArtistRole: unknown
): coArtistRole is CoArtistRole {
  if (typeof coArtistRole !== 'string') {
    return false;
  }

  const content = coArtistRole.slice(1);

  switch (coArtistRole[0]) {
    case CO_ARTIST_ROLE_PREFIX_BUILTIN:
      return builtinCoArtistRoleSet.has(content);

    case CO_ARTIST_ROLE_PREFIX_USER_DEFINED:
      return isValidUserDefinedCoArtistRole(content);
  }

  return false;
}
