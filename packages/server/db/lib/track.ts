import type { Track } from '@prisma/client';
import {
  TableWithJunctionTableArray,
  TableWithSortedItems,
  dbArrayConvert,
} from './array';

export type TrackArrayConvertInput<V extends Track> =
  TableWithJunctionTableArray<'track', V>;

export function dbTrackArrayConvert<
  V extends Track,
  T extends TrackArrayConvertInput<V>
>(item: T): TableWithSortedItems<'track', V, T> {
  return dbArrayConvert(item, 'track');
}
