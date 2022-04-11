import { describe, expect, it } from 'vitest';
import { TranscoderRequestOptions } from '$transcoder/types';
import {
  parseDiscAndTrackNumber,
  parseDiscAndTrackNumberEx,
} from '$/services/parseDiscTrackNumber';

describe('parseDiscAndTrackNumber', (): void => {
  it('should parse track "5", "05", "2.5", "02.05"', (): void => {
    expect(
      parseDiscAndTrackNumber({
        track: '5',
      })
    ).toEqual([1, 5]);

    expect(
      parseDiscAndTrackNumber({
        track: '05',
      })
    ).toEqual([1, 5]);

    expect(
      parseDiscAndTrackNumber({
        track: '2.5',
      })
    ).toEqual([2, 5]);

    expect(
      parseDiscAndTrackNumber({
        track: '02.05',
      })
    ).toEqual([2, 5]);
  });

  it('should parse track "05", "02.05" w/ disc "03"', (): void => {
    expect(
      parseDiscAndTrackNumber({
        disc: '03',
        track: '05',
      })
    ).toEqual([3, 5]);

    expect(
      parseDiscAndTrackNumber({
        disc: '03',
        track: '02.05',
      })
    ).toEqual([2, 5]);
  });
});

describe('parseDiscAndTrackNumberEx', (): void => {
  const options: TranscoderRequestOptions = {
    guessDiscNumberUsingFilename: true,
    guessTrackNumberUsingFilename: true,
    guessDiscNumberUsingFilenameForCue: true,
    //
    defaultUnknownAlbumArtist: 'Unknown Artist',
    defaultUnknownAlbumTitle: 'Unknown Album',
    defaultUnknownTrackTitle: 'Unknown Track',
    defaultUnknownTrackArtist: 'Unknown Artist',
    extractImages: true,
    preferExternalCueSheet: true,
    useFilenameAsUnknownTrackTitle: true,
    useTrackArtistAsUnknownAlbumArtist: true,
    useTrackTitleAsUnknownAlbumTitle: true,
  };

  it('should prefer tag over filename', (): void => {
    expect(
      parseDiscAndTrackNumberEx(
        {
          track: '5',
        },
        '08 track.mp3',
        false,
        options
      )
    ).toEqual([1, 5]);

    expect(
      parseDiscAndTrackNumberEx(
        {
          track: '5',
          disc: '2',
        },
        '3.08 track.mp3',
        false,
        options
      )
    ).toEqual([2, 5]);
  });

  it('should guess from filename if tag does not exist', (): void => {
    expect(
      parseDiscAndTrackNumberEx({}, '08 track.mp3', false, options)
    ).toEqual([1, 8]);

    expect(
      parseDiscAndTrackNumberEx(
        {
          disc: '2',
        },
        '08 track.mp3',
        false,
        options
      )
    ).toEqual([2, 8]);

    expect(
      parseDiscAndTrackNumberEx(
        {
          track: '5',
        },
        '3.08 track.mp3',
        false,
        options
      )
    ).toEqual([3, 5]);
  });

  it('should guess from filename (various formats)', (): void => {
    expect(
      parseDiscAndTrackNumberEx({}, '03 08 track.mp3', false, options)
    ).toEqual([3, 8]);

    expect(
      parseDiscAndTrackNumberEx({}, '03.08-track.mp3', false, options)
    ).toEqual([3, 8]);

    expect(
      parseDiscAndTrackNumberEx({}, '03-08_track.mp3', false, options)
    ).toEqual([3, 8]);

    expect(
      parseDiscAndTrackNumberEx({}, '03_08.track.mp3', false, options)
    ).toEqual([3, 8]);
  });

  it('should guess from filename (for CUE sheets)', (): void => {
    expect(
      parseDiscAndTrackNumberEx({}, 'ABCD-1234.wav', true, options)
    ).toEqual([1, 1]);

    expect(
      parseDiscAndTrackNumberEx({}, 'ABCD-0003.wav', true, options)
    ).toEqual([1, 1]);

    expect(parseDiscAndTrackNumberEx({}, 'ABCD-20.wav', true, options)).toEqual(
      [1, 1]
    );

    expect(parseDiscAndTrackNumberEx({}, 'Disc3.wav', true, options)).toEqual([
      3, 1,
    ]);

    expect(parseDiscAndTrackNumberEx({}, 'ABCD-3.wav', true, options)).toEqual([
      3, 1,
    ]);

    expect(parseDiscAndTrackNumberEx({}, 'ABCD-03.wav', true, options)).toEqual(
      [3, 1]
    );

    expect(
      parseDiscAndTrackNumberEx({}, 'ABCD-1234-03.wav', true, options)
    ).toEqual([3, 1]);
  });
});
