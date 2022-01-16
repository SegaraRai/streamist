import type { CoArtistRole } from '$shared/coArtist';
import type {
  ICoArtistUpdate,
  ICoArtistUpdateAdd,
  ICoArtistUpdateRemove,
} from '$/validators';

export type CoArtist = [
  role: CoArtistRole,
  artistId: string | undefined,
  artistName: string
];

export function createCoArtistUpdate(
  orgItems: readonly Readonly<CoArtist>[],
  newItems: readonly Readonly<CoArtist>[]
): ICoArtistUpdate | undefined {
  const add: ICoArtistUpdateAdd[] = [];
  const remove: ICoArtistUpdateRemove[] = [];

  const orgSet = new Set(
    orgItems
      .filter(([, artistId]) => artistId)
      .map(([role, artistId]) => `${role}\n${artistId}`)
  );
  const newSet = new Set(
    newItems
      .filter(([, artistId]) => artistId)
      .map(([role, artistId]) => `${role}\n${artistId}`)
  );

  for (const item of newItems) {
    const [role, artistId, artistName] = item;

    if (artistId) {
      const key = `${role}\n${artistId}`;

      if (!orgSet.has(key)) {
        add.push({ role, artistId });
      }
    } else if (artistName) {
      add.push({ role, artistName });
    }
  }

  for (const item of orgItems) {
    const [role, artistId] = item;
    if (!artistId) {
      // should not happen
      continue;
    }

    const key = `${role}\n${artistId}`;

    if (!newSet.has(key)) {
      remove.push({ role, artistId });
    }
  }

  return add.length || remove.length
    ? {
        add: add.length ? add : undefined,
        remove: remove.length ? remove : undefined,
      }
    : undefined;
}

export function isSameCoArtists(
  orgItems: readonly Readonly<CoArtist>[],
  newItems: readonly Readonly<CoArtist>[]
): boolean {
  return !createCoArtistUpdate(orgItems, newItems);
}
