/**
 * 一時ディレクトリ
 */
export const TEMP_DIR =
  process.env.NODE_ENV === 'production' ||
  process.env.NODE_ENV === 'staging' ||
  process.platform !== 'win32'
    ? '/tmp'
    : './temp';

/**
 * 一時ディレクトリ（大きいファイル用）
 */
export const NFS_TEMP_DIR =
  process.env.NODE_ENV === 'production' ||
  process.env.NODE_ENV === 'staging' ||
  process.platform !== 'win32'
    ? '/mnt/tmp'
    : './temp';
