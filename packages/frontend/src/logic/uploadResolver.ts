import { getExtension, getStem } from '$shared/path';
import { getSourceFileType } from '$shared/sourceFileConfig';
import { compareString } from './sort';

export interface ResolvedUploadFileAudio {
  type: 'audio';
  file: File;
}

export interface ResolvedUploadFileAudioWithCueSheet {
  type: 'audioWithCueSheet';
  file: File;
  cueSheetFile: File;
}

export interface ResolvedUploadFileImage {
  type: 'image';
  file: File;
  dependsOn: ResolvedUploadFileAudio | ResolvedUploadFileAudioWithCueSheet;
}

export interface ResolvedUploadFileUnsupported {
  type: 'unknown';
  file: File;
}

export type ResolvedUploadFile =
  | ResolvedUploadFileAudio
  | ResolvedUploadFileAudioWithCueSheet
  | ResolvedUploadFileImage
  | ResolvedUploadFileUnsupported;

const LOSSLESS_AUDIO_FILE_EXTENSION_SET: ReadonlySet<string> =
  /* @__PURE__ */ new Set([
    '.aiff',
    '.ape',
    '.flac',
    '.m4a', // ALAC, in case
    '.tak',
    '.tta',
    '.wav',
    '.wma', // WMA Lossless, in case
    '.wv',
  ]);

function resolveUploadFilesImpl(files: readonly File[]): ResolvedUploadFile[] {
  const typeAndFiles = files.map(
    (file) => [getSourceFileType(file.name) || 'unknown', file] as const
  );

  const cueSheetFileSet = new Set(
    typeAndFiles.filter(([type]) => type === 'cueSheet')
  );
  const audioFileSet = new Set(
    typeAndFiles.filter(([type]) => type === 'audio')
  );
  const imageFileSet = new Set(
    typeAndFiles.filter(([type]) => type === 'image')
  );
  const unknownFileSet = new Set(
    typeAndFiles.filter(([type]) => type === 'unknown')
  );

  // CUEシートと音声ファイルを対応付けて追加
  const resAudioWithCueSheetFiles: ResolvedUploadFileAudioWithCueSheet[] = [];
  for (const audioFile of audioFileSet) {
    if (
      !LOSSLESS_AUDIO_FILE_EXTENSION_SET.has(
        getExtension(audioFile[1].name).toLowerCase()
      )
    ) {
      continue;
    }

    // 本当はCUEシートに記載されているファイル名を探すべきだが、面倒なのでファイル名を直接比較する
    const stem = getStem(audioFile[1].name).toLowerCase();
    const cueSheetFile = Array.from(cueSheetFileSet).find(
      ([, file]) => getStem(file.name).toLowerCase() === stem
    );
    if (!cueSheetFile) {
      continue;
    }

    resAudioWithCueSheetFiles.push({
      type: 'audioWithCueSheet',
      file: audioFile[1],
      cueSheetFile: cueSheetFile[1],
    });

    audioFileSet.delete(audioFile);
    cueSheetFileSet.delete(cueSheetFile);
  }

  // TODO: 対応付けられていないファイルが有る場合は中断する？

  // その他の音声ファイルを追加
  const resAudioFiles: ResolvedUploadFileAudio[] = [];
  for (const audioFile of audioFileSet) {
    resAudioFiles.push({
      type: 'audio',
      file: audioFile[1],
    });

    audioFileSet.delete(audioFile);
  }

  // 画像ファイルを音声ファイルに対応付ける
  const resImageFiles: ResolvedUploadFileImage[] = [];
  const imageTargetAudioFile = [
    ...resAudioWithCueSheetFiles,
    ...resAudioFiles,
  ].sort((a, b) => {
    const ta = a.type === 'audioWithCueSheet' ? 0 : 1;
    const tb = b.type === 'audioWithCueSheet' ? 0 : 1;
    return ta - tb || compareString(a.file.name, b.file.name);
  })[0];
  if (imageTargetAudioFile) {
    for (const imageFile of imageFileSet) {
      resImageFiles.push({
        type: 'image',
        file: imageFile[1],
        dependsOn: {
          type: 'audio',
          file: imageTargetAudioFile.file,
        },
      });

      imageFileSet.delete(imageFile);
    }
  }

  // その他のファイルを追加
  const resUnknownFiles: ResolvedUploadFileUnsupported[] = [];
  for (const file of [
    ...audioFileSet,
    ...cueSheetFileSet,
    ...imageFileSet,
    ...unknownFileSet,
  ]) {
    resUnknownFiles.push({
      type: 'unknown',
      file: file[1],
    });
  }

  return [
    ...resAudioWithCueSheetFiles,
    ...resAudioFiles,
    ...resImageFiles,
    ...resUnknownFiles,
  ].sort((a, b) => compareString(a.file.name, b.file.name));
}

export function resolveUploadFiles(
  files: readonly File[]
): ResolvedUploadFile[] {
  // TODO: handle webkitRelativePath
  return resolveUploadFilesImpl(files);
}

export function removeUploadFile(
  originalFiles: readonly ResolvedUploadFile[],
  file: File
): ResolvedUploadFile[] {
  return originalFiles
    .filter((uploadFile) => uploadFile.file !== file)
    .map((uploadFile) => {
      if (uploadFile.type === 'image' && uploadFile.dependsOn?.file === file) {
        return {
          ...uploadFile,
          type: 'unknown',
          dependsOn: null,
        };
      }
      return uploadFile;
    });
}
