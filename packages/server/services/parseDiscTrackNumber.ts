import { getStem } from '$shared/path';
import type { FFprobeTags, TranscoderRequestOptions } from '$transcoder/types';
import { integerOr } from '$/services/parseNumber';

export function parseDiscAndTrackNumber(
  tags: FFprobeTags,
  defaultDiscNumber = 1,
  defaultTrackNumber = 1
): [discNumber: number, trackNumber: number] {
  // possible formats of tags.track:
  // 2, 02, 2/4, 02/04, 1.2, 1.02, 01.2, 01.02

  let discNumber: number | undefined;
  let trackNumber: number | undefined;

  const strDisc = tags.disc?.replace(/\s/g, '');
  const strTrack = tags.track?.replace(/\s/g, '');
  if (strDisc) {
    discNumber = integerOr(strDisc, undefined, 1, true);
  }
  if (strTrack) {
    const match = strTrack.match(/^(\d+)\.(\d+)/);
    if (match) {
      discNumber = integerOr(match[1], undefined, 1, true);
      trackNumber = integerOr(match[2], undefined, 1, true);
    } else {
      trackNumber = integerOr(strTrack, undefined, 1, true);
    }
  }

  return [
    discNumber || defaultDiscNumber, // ディスク番号が0またはundefinedのときはdefaultDiscNumberにする
    trackNumber || defaultTrackNumber, // トラック番号が0またはundefinedのときはdefaultTrackNumberにする
  ];
}

export function parseDiscAndTrackNumberEx(
  tags: FFprobeTags,
  filename: string,
  hasCueSheet: boolean,
  options: TranscoderRequestOptions
): [discNumber: number, trackNumber: number] {
  let [discNumber, trackNumber] = parseDiscAndTrackNumber(tags, 0, 0);

  const parseDiscNumber = (
    strValue: string | null | undefined
  ): number | null => {
    if (!strValue || strValue.length > 2) {
      // ignore something like '0002'
      return null;
    }
    const value = parseInt(strValue, 10);
    if (!isFinite(value) || value < 1 || value > 99) {
      return null;
    }
    return value;
  };

  const parseTrackNumber = (
    strValue: string | null | undefined
  ): number | null => {
    if (!strValue || strValue.length > 2) {
      return null;
    }
    const value = parseInt(strValue, 10);
    if (!isFinite(value) || value < 1 || value > 99) {
      return null;
    }
    return value;
  };

  const basename = getStem(filename).trim();

  if (hasCueSheet) {
    // eg. 'Disc2', 'ABCD-1234-2', 'ABCD-1234' (not valid)
    const match = basename.match(/(\d+)$/);
    if (match) {
      const newDiscNumber = parseDiscNumber(match[1]);
      if (
        options.guessDiscNumberUsingFilenameForCue &&
        discNumber === 0 &&
        newDiscNumber != null
      ) {
        discNumber = newDiscNumber;
      }
    }
  } else {
    // eg. '2.03 Track Title', '03. Track Title', '03 Track Title'
    const match = basename.match(/^(?:(\d+)[\s._-]+)?(\d+)/);
    if (match) {
      const newDiscNumber = match[1] ? parseDiscNumber(match[1]) : undefined;
      const newTrackNumber = parseTrackNumber(match[2]);
      if (
        options.guessDiscNumberUsingFilename &&
        discNumber === 0 &&
        newDiscNumber != null
      ) {
        discNumber = newDiscNumber;
      }
      if (
        options.guessTrackNumberUsingFilename &&
        trackNumber === 0 &&
        newTrackNumber != null
      ) {
        trackNumber = newTrackNumber;
      }
    }
  }

  return [
    discNumber || 1, // discNumberが0のときは1にする
    trackNumber || 1, // trackNumberが0のときは1にする
  ];
}
