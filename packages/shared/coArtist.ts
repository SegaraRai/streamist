import { normalizeTextForSingleLine } from './normalize';

export const CO_ARTIST_ROLE_PREFIX_BUILTIN = '#' as const;
export const CO_ARTIST_ROLE_PREFIX_USER_DEFINED = '=' as const;

export const unPrefixedBuiltinCoArtistRoles = [
  'arranger',
  'artist',
  'composer',
  'lyricist',
  'producer',
  'vocal',
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

export function isValidUserDefinedCoArtistRoleText(text: string): boolean {
  return text.length > 0 && text === normalizeTextForSingleLine(text);
}

export function isValidCoArtistRole(role: unknown): role is CoArtistRole {
  if (typeof role !== 'string') {
    return false;
  }

  const content = role.slice(1);

  switch (role[0]) {
    case CO_ARTIST_ROLE_PREFIX_BUILTIN:
      return builtinCoArtistRoleSet.has(role);

    case CO_ARTIST_ROLE_PREFIX_USER_DEFINED:
      return isValidUserDefinedCoArtistRoleText(content);
  }

  return false;
}

export function isBuiltinCoArtistRole(role: CoArtistRole): boolean {
  return role[0] === CO_ARTIST_ROLE_PREFIX_BUILTIN;
}
