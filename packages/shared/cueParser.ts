interface Rem {
  remMap: Map<string, string>;
  rems: string[];
}

export interface Track extends Rem {
  trackNumber: number;
  type: string;
  flags?: string;
  isrc?: string;
  performer?: string;
  songWriter?: string;
  title?: string;
  postGap?: number;
  preGap?: number;
  offsetMap: Map<number, number>;
  offsetMapObject: Record<number, number>;
}

export interface File {
  filename: string;
  type: string;
  tracks: Track[];
}

export interface CueSheet extends Rem {
  catalog?: string;
  cdTextFile?: string;
  performer?: string;
  songWriter?: string;
  title?: string;
  files: File[];
  trackMap: Map<number, Track[]>; // track number -> track[]
}

// エスケープ文字の対応付け
const escapeMap = /* #__PURE__ */ new Map<string, string>([
  ['"', '"'],
  ['\\', '\\'],
]);

export class CueSheetParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CueSheetParseError';
  }
}

/**
 * 二重引用符で囲われた文字列のエスケープを解除する \
 * 二重引用符で囲われていない文字列はなにも処理せずに返す
 * @param str エスケープされているか、されていない文字列
 * @returns エスケープを解除した文字列
 */
function unescapeValue(str: string): string {
  // 二重引用符で囲われていなければそのまま返す
  if (!/^".*"$/.test(str)) {
    return str;
  }

  // "A "test" string" のようなものもパースできるようにしておく（"A \"test\" string"として扱う）
  str = str.slice(1, str.length - 1);
  str = str.replace(
    /\\./g,
    (sequence) => escapeMap.get(sequence.slice(1)) || sequence.slice(1)
  );
  return str;
}

/**
 * `MM:SS:FF`形式の時間表記を解析し、フレーム数で返す \
 * すなわち、`(MM * 60 + SS) * 75 + FF`を返す
 * @param strTime `MM:SS:FF`形式の時間表記
 * @returns フレーム数
 */
function parseTime(strTime: string): number {
  const match = strTime.match(/^(\d\d):(\d\d):(\d\d)$/);
  if (!match) {
    throw new CueSheetParseError('invalid offset');
  }
  const [, minutes, seconds, frames] = match;
  const value =
    (parseInt(minutes, 10) * 60 + parseInt(seconds, 10)) * 75 +
    parseInt(frames, 10);
  if (!isFinite(value)) {
    throw new CueSheetParseError('invalid offset');
  }
  return value;
}

/**
 * REMコマンドを解析し、オブジェクトに格納する
 * @param object `CueSheet`または`Track`のオブジェクト
 * @param content "REM "以降の文字列
 */
function parseRem(object: CueSheet | Track, content: string): void {
  object.rems.push(content);
  const match = content.match(/^(\S+)\s+(.+)$/);
  if (match) {
    object.remMap.set(match[1].toUpperCase(), unescapeValue(match[2]));
  }
}

/**
 * CUEシートをパースする
 * @param strCueSheet CUEシートの内容
 * @returns `CueSheet`オブジェクト
 */
export function parseCueSheet(strCueSheet: string): CueSheet {
  const cueSheet: CueSheet = {
    files: [],
    trackMap: new Map(),
    remMap: new Map(),
    rems: [],
  };

  let lastFile: File | undefined;
  let lastTrack: Track | undefined;

  // 念の為BOM除去
  if (strCueSheet.startsWith('\uFEFF')) {
    strCueSheet = strCueSheet.slice(1);
  }

  for (const [lineIndex, orgLine] of strCueSheet.split(/\r?\n/).entries()) {
    try {
      const line = orgLine.trim();

      if (!line) {
        continue;
      }

      const lineMatch = line.match(/^(\S+)(?:\s+(.+))?$/);
      if (!lineMatch) {
        // 起こらない（正規表現が失敗しない）はず
        throw new CueSheetParseError('failed to parse command');
      }

      const [, command, args] = lineMatch;

      switch (command.toUpperCase()) {
        case 'CATALOG':
          // eg. CATALOG 4988001745273
          cueSheet.catalog = unescapeValue(args);
          break;

        case 'CDTEXTFILE':
          // eg. CDTEXTFILE "example.cdt"
          cueSheet.cdTextFile = unescapeValue(args);
          break;

        case 'FILE': {
          // eg. FILE "COCC-16718.flac" WAVE
          const match = args.match(/^("(?:.|\\.)+"|\S+)\s+("(?:.|\\.)+"|\S+)$/);
          if (!match) {
            throw new CueSheetParseError('invalid FILE arguments');
          }
          const [, filename, type] = match;
          lastFile = {
            filename: unescapeValue(filename),
            type: unescapeValue(type),
            tracks: [],
          };
          cueSheet.files.push(lastFile);
          break;
        }

        case 'FLAGS':
          // eg. FLAGS DCP
          if (!lastTrack) {
            throw new CueSheetParseError('no TRACK specified for FLAGS');
          }
          lastTrack.flags = unescapeValue(args);
          break;

        case 'INDEX': {
          // eg. INDEX 00 04:06:09
          //     INDEX 01 04:07:15
          // NOTE: MM:SS:FF の FF は 0 ~ 74
          if (!lastTrack) {
            throw new CueSheetParseError('no TRACK specified for INDEX');
          }
          const [strIndex, strOffset] = args.split(/\s+/);
          const index = parseInt(strIndex, 10);
          const time = parseTime(strOffset);
          lastTrack.offsetMap.set(index, time);
          lastTrack.offsetMapObject[index] = time;
          break;
        }

        case 'ISRC':
          // eg. ISRC JPCO01306800
          if (!lastTrack) {
            throw new CueSheetParseError('no TRACK specified for ISRC');
          }
          lastTrack.isrc = unescapeValue(args);
          break;

        case 'PERFORMER':
          // eg. PERFORMER "Example Performer"
          (lastTrack || cueSheet).performer = unescapeValue(args);
          break;

        case 'POSTGAP':
          // eg. POSTGAP 00:05:00
          if (!lastTrack) {
            throw new CueSheetParseError('no TRACK specified for POSTGAP');
          }
          lastTrack.postGap = parseTime(args);
          break;

        case 'PREGAP':
          // eg. PREGAP 00:05:00
          if (!lastTrack) {
            throw new CueSheetParseError('no TRACK specified for PREGAP');
          }
          lastTrack.preGap = parseTime(args);
          break;

        case 'REM':
          // eg. REM COMMENT "ExactAudioCopy v1.3"
          //     REM GENRE Game
          //     REM DATE 2013/04/10
          //     REM DISCID 6A0A4E07
          //     REM COMPOSER "Example Composer"
          //     REM PERFORMER_SORT "Example Performer"
          //     REM an arbitrary comment
          parseRem(lastTrack || cueSheet, args);
          break;

        case 'SONGWRITER':
          // eg. SONGWRITER "Example Song Writer"
          (lastTrack || cueSheet).songWriter = unescapeValue(args);
          break;

        case 'TITLE':
          // eg. TITLE "Example Title"
          (lastTrack || cueSheet).title = unescapeValue(args);
          break;

        case 'TRACK': {
          // eg. TRACK 01 AUDIO
          if (!lastFile) {
            throw new CueSheetParseError('no FILE specified for TRACK');
          }
          const match = args.match(/^(\d+)\s+(.+)/);
          if (!match) {
            throw new CueSheetParseError('invalid TRACK arguments');
          }
          const trackNumber = parseInt(match[1], 10);
          const type = match[2];
          lastTrack = {
            trackNumber,
            type,
            offsetMap: new Map(),
            offsetMapObject: {},
            remMap: new Map(),
            rems: [],
          };
          lastFile.tracks.push(lastTrack);
          if (!cueSheet.trackMap.has(trackNumber)) {
            cueSheet.trackMap.set(trackNumber, []);
          }
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          cueSheet.trackMap.get(trackNumber)!.push(lastTrack);
          break;
        }

        default:
          throw new CueSheetParseError(`unknown command: ${command}`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        error.message += ` at line ${lineIndex + 1}`;
      }
      throw error;
    }
  }

  return cueSheet;
}
