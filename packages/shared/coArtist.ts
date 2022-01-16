import { normalizeTextForSingleLine } from './normalize';

export const CO_ARTIST_ROLE_PREFIX_BUILTIN = '#' as const;
export const CO_ARTIST_ROLE_PREFIX_USER_DEFINED = '=' as const;

export const unPrefixedBuiltinCoArtistRoles = [
  'artist',
  'vocal',
  'arranger',
  'composer',
  'lyricist',
  'producer',
] as const;

export const builtinCoArtistRoles = unPrefixedBuiltinCoArtistRoles.map(
  (role) => `${CO_ARTIST_ROLE_PREFIX_BUILTIN}${role}` as const
);

export type UnPrefixedBuiltinCoArtistRole =
  typeof unPrefixedBuiltinCoArtistRoles[number];

export type BuiltinCoArtistRole = typeof builtinCoArtistRoles[number];

const builtinCoArtistRoleSet: ReadonlySet<string> = new Set(
  builtinCoArtistRoles
);

export type UserDefinedCoArtistRole =
  `${typeof CO_ARTIST_ROLE_PREFIX_USER_DEFINED}${string}`;

export type CoArtistRole =
  | `${BuiltinCoArtistRole}`
  | `${UserDefinedCoArtistRole}`;

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
      return builtinCoArtistRoleSet.has(coArtistRole);

    case CO_ARTIST_ROLE_PREFIX_USER_DEFINED:
      return isValidUserDefinedCoArtistRole(content);
  }

  return false;
}
