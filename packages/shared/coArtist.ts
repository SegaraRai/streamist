export const CO_ARTIST_PREFIX_BUILTIN = '#' as const;
export const CO_ARTIST_PREFIX_USER_DEFINED = '=' as const;

export const builtinCoArtistTypes = [
  'artist',
  'vocal',
  'arranger',
  'composer',
  'lyricist',
  'producer',
] as const;

export type BuiltinCoArtistType = typeof builtinCoArtistTypes[number];

const builtinCoArtistTypeSet: ReadonlySet<string> = new Set(
  builtinCoArtistTypes
);

export type CoArtistType =
  | `${typeof CO_ARTIST_PREFIX_BUILTIN}${BuiltinCoArtistType}`
  | `${typeof CO_ARTIST_PREFIX_USER_DEFINED}${string}`;

export function isValidUserDefinedCoArtistText(text: string): boolean {
  return (
    text.length > 0 &&
    !/[\r\n\v\f\u0085\u2028\u2029]/.test(text) &&
    !/^\s|\s$/.test(text)
  );
}

export function isValidCoArtistType(
  coArtistType: string
): coArtistType is CoArtistType {
  const content = coArtistType.slice(1);

  switch (coArtistType[0]) {
    case CO_ARTIST_PREFIX_BUILTIN:
      return builtinCoArtistTypeSet.has(content);

    case CO_ARTIST_PREFIX_USER_DEFINED:
      return isValidUserDefinedCoArtistText(content);
  }

  return false;
}
