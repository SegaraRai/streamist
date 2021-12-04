function createDate(year: string, month = '1', date = '1'): Date {
  const d = new Date(
    `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${date.padStart(
      2,
      '0'
    )}`
  );
  if (!isFinite(d.getTime())) {
    throw new TypeError('invalid date');
  }

  return d;
}

export type DatePrecision = 'year' | 'month' | 'day';

export interface ParsedDate {
  date$$q: Date;
  dateString$$q: string;
  precision$$q: DatePrecision;
  text$$q: string;
}

export function parseDate(dateString: string): ParsedDate | undefined {
  try {
    dateString = dateString.trim();

    let match;
    let strYear: string | undefined;
    let strMonth: string | undefined;
    let strDate: string | undefined;

    if ((match = dateString.match(/\b(\d{4})\D+(\d{1,2})\D+(\d{1,2})\b/))) {
      // YYYY-mm-dd
      [, strYear, strMonth, strDate] = match;
      // 多少はmm.ddとdd.mmの区別を頑張ってみる
      if (parseInt(strMonth, 10) > 12) {
        [strDate, strMonth] = [strMonth, strDate];
      }
    } else if (
      (match = dateString.match(/\b(\d{1,2})\D+(\d{1,2})\D+(\d{4})\b/))
    ) {
      // dd.mm.YYYY
      // 本当は mm.dd.YYYY と区別したいが不可能
      [, strDate, strMonth, strYear] = match;
      // 多少はmm.ddとdd.mmの区別を頑張ってみる
      if (parseInt(strMonth, 10) > 12) {
        [strDate, strMonth] = [strMonth, strDate];
      }
    } else if ((match = dateString.match(/\b(\d{4})\D+(\d{1,2})\b/))) {
      // YYYY-mm
      [, strYear, strMonth] = match;
    } else if ((match = dateString.match(/\b(\d{1,2})\D+(\d{4})\b/))) {
      // mm.YYYY
      [, strMonth, strYear] = match;
    }
    if ((match = dateString.match(/\b(\d{4})\b/))) {
      // YYYY
      [, strYear] = match;
    }

    if (!strYear) {
      return undefined;
    }

    const date = createDate(strYear, strMonth || '1', strDate || '1');

    return {
      date$$q: date,
      dateString$$q: date.toISOString().replace(/T.+$/, ''),
      precision$$q: strMonth ? (strDate ? 'day' : 'month') : 'year',
      text$$q: dateString,
    };
  } catch (_error) {
    // 失敗したらundefined
  }

  return undefined;
}
