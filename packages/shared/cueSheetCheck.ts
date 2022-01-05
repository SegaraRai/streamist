import type { CueSheet } from './cueParser';
import { CUE_SHEET_OFFSET_INDEX } from './cueSheetConfig';

export class CueSheetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CueSheetError';
  }
}

export function validateCueSheet(cueSheet: CueSheet) {
  // FILEコマンドがなければエラー
  if (cueSheet.files.length === 0) {
    throw new CueSheetError(
      'invalid cue sheet. the cue sheet has no FILE command.'
    );
  }

  // FILEコマンドが2つ以上存在すればエラー
  if (cueSheet.files.length !== 1) {
    throw new CueSheetError(
      'unsupported cue sheet. the cue sheet has too many FILE commands.'
    );
  }

  const cueSheetTracks = cueSheet.files.flatMap((file) => file.tracks);

  // TRACKが存在しなければエラー
  if (cueSheetTracks.length === 0) {
    throw new CueSheetError('unsupported cue sheet. no TRACK found.');
  }

  if (
    cueSheetTracks.some((track) => !track.offsetMap.has(CUE_SHEET_OFFSET_INDEX))
  ) {
    // INDEX 01がないTRACKが存在すればエラー
    throw new CueSheetError(
      'unsupported cue sheet. INDEX 01 is missing in TRACK.'
    );
  }
}
