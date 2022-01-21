/**
 * ファイルパスからディレクトリを除いたファイル名を取得する \
 * 正規化はされていることを前提とする
 * @param filepath ファイルパス
 * @return ディレクトリを除いたファイル名
 * @example
 * getFilename('example');              // => 'example'
 * getFilename('example.txt');          // => 'example.txt'
 * getFilename('example.tar.xz');       // => 'example.tar.xz'
 * getFilename('.gitignore');           // => '.gitignore'
 * getFilename('/path/to/file.dat');    // => 'file.dat'
 * getFilename('/this/is/a/.dir/');     // => ''
 * getFilename('/');                    // => ''
 * getFilename('');                     // => ''
 */
export function getFilename(filepath: string): string {
  /*
  if (/^\.+[\\/]|[\\/]\.+[\\/]/.test(filepath)) {
    throw new Error('invalid path');
  }
  //*/

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return filepath.split(/[\\/]/).pop()!;
}

/**
 * ファイルパスから拡張子を除いたファイル名を取得する \
 * 正規化はされていることを前提とする
 * @param filepath ファイルパス
 * @return 拡張子を除いたファイル名
 * @example
 * getStem('example');              // => 'example'
 * getStem('example.txt');          // => 'example'
 * getStem('example.tar.xz');       // => 'example.tar'
 * getStem('example.dat.');         // => 'example.dat'
 * getStem('.gitignore');           // => ''
 * getStem('/path/to/file.dat');    // => 'file'
 * getStem('/this/is/a/.dir/');     // => ''
 * getStem('/');                    // => ''
 * getStem('');                     // => ''
 */
export function getStem(filepath: string): string {
  const filename = getFilename(filepath);
  return filename.replace(/\.[^.]*$/, '');
}

/**
 * ファイルパスから拡張子を取得する \
 * 正規化はされていることを前提とする
 * @param filepath ファイルパス
 * @return ピリオドを含む拡張子
 * @example
 * getExtension('example');             // => ''
 * getExtension('example.txt');         // => '.txt'
 * getExtension('example.tar.xz');      // => '.xz'
 * getExtension('.gitignore');          // => '.gitignore'
 * getExtension('/path/to/file.dat');   // => '.dat'
 * getExtension('/this/is/a/.dir/');    // => ''
 * getExtension('/');                   // => ''
 * getExtension('');                    // => ''
 */
export function getExtension(filepath: string): string {
  const filename = getFilename(filepath);
  const lastPeriod = filename.lastIndexOf('.');
  if (lastPeriod < 0) {
    return '';
  }
  return filename.slice(lastPeriod);
}
