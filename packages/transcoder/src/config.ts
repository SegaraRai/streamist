/**
 * 署名の時刻との差の許容範囲（秒）
 * コールドスタートの可能性を考慮しておく
 */
export const clockTolerance = 50 * 60;

/**
 * 一時ディレクトリ
 */
export const tempDir =
  process.env.NODE_ENV === 'production' ||
  process.env.NODE_ENV === 'staging' ||
  process.platform !== 'win32'
    ? '/tmp'
    : './temp';
