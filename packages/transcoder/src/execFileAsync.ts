import { ExecFileException, execFile } from 'node:child_process';
import logger from './logger';

export interface ExecFileResult {
  error$$q: ExecFileException | null;
  stdout$$q: string;
  stderr$$q: string;
}

function escapeShell(str: string): string {
  const escapedStr = str
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/"/g, '\\"');

  return escapedStr !== str || /\s/.test(str) ? `"${escapedStr}"` : str;
}

export function execFileAsync(
  file: string,
  args: string[],
  timeout: number
): Promise<ExecFileResult> {
  return new Promise<ExecFileResult>((resolve): void => {
    logger.info(`exec     ${file} ${args.map(escapeShell).join(' ')}`);
    execFile(
      file,
      args,
      {
        encoding: 'utf8',
        timeout,
      },
      (error, stdout, stderr) => {
        logger.info(`exec-end ${file} ${error}`);
        logger.info(`exec-end-stdout ${stdout}`);
        logger.info(`exec-end-stderr ${stderr}`);
        resolve({
          error$$q: error,
          stdout$$q: stdout,
          stderr$$q: stderr,
        });
      }
    );
  });
}
