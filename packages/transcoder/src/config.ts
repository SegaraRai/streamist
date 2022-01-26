/**
 * 一時ディレクトリ
 */
export const TEMP_DIR =
  process.env.NODE_ENV === 'production' ||
  process.env.NODE_ENV === 'staging' ||
  process.platform !== 'win32'
    ? '/tmp'
    : './temp';
