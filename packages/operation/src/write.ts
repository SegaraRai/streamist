import { mkdir, writeFile } from 'fs/promises';

let envDir = 'undefined';
export function setResultEnvDir(dir: string) {
  envDir = dir;
}

export async function writeResultFile(
  filename: string,
  content: string | readonly unknown[] | Record<string, unknown>
): Promise<void> {
  if (typeof content !== 'string') {
    content = JSON.stringify(content, null, 2) + '\n';
  }
  const dir = `result/${envDir}`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/${filename}`, content);
}
