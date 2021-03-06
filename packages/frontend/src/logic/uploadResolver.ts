import { getExtension, getStem } from '$shared/path';
import { getSourceFileType } from '$shared/sourceFileType';
import { SourceFileType } from '$shared/types';
import { compareString } from '$/shared/sort';
import { LOSSLESS_AUDIO_FILE_EXTENSION_SET } from '~/config';

export type ResolvedFileId = symbol;

export interface ResolvedUploadFileAudio {
  id: symbol;
  type: 'audio';
  file: File;
}

export interface ResolvedUploadFileAudioWithCueSheet {
  id: symbol;
  type: 'audioWithCueSheet';
  file: File;
  cueSheetFile: File;
}

export interface ResolvedUploadFileImage {
  id: symbol;
  type: 'image';
  file: File;
  dependsOn: ResolvedFileId;
}

export interface ResolvedUploadFileUnsupported {
  id: symbol;
  type: 'unknown';
  file: File;
}

export type ResolvedUploadFile =
  | ResolvedUploadFileAudio
  | ResolvedUploadFileAudioWithCueSheet
  | ResolvedUploadFileImage
  | ResolvedUploadFileUnsupported;

function generateFileId(): ResolvedFileId {
  return Symbol('resolvedFileId');
}

function calcImageAndAudioRelationScore(
  imageFile: File,
  audioFile: ResolvedUploadFileAudio | ResolvedUploadFileAudioWithCueSheet
): number {
  const imageFileStem = getStem(imageFile.name)
    .toLowerCase()
    .replace(/[^a-z\d]/g, '');
  const audioFileStem = getStem(audioFile.file.name)
    .toLowerCase()
    .replace(/[^a-z\d]/g, '');
  if (imageFileStem === audioFileStem) {
    // foo.jpg and foo.mp3
    return 100;
  }
  if (audioFileStem.includes(imageFileStem)) {
    // foo01.jpg and foo.mp3
    return 90;
  }
  if (imageFileStem.includes(audioFileStem)) {
    // foo.jpg and foo01.mp3
    return 80;
  }
  return 0;
}

function calcCueSheetAndAudioRelationScore(
  cueSheetFilename: string,
  audioFilename: string
): number {
  const cueSheetFileStem = getStem(cueSheetFilename)
    .toLowerCase()
    .replace(/[^a-z\d]/g, '');
  const audioFileStem = getStem(audioFilename)
    .toLowerCase()
    .replace(/[^a-z\d]/g, '');
  if (cueSheetFileStem === audioFileStem) {
    // foo.cue and foo.mp3
    return 100;
  }
  if (audioFileStem.includes(cueSheetFileStem)) {
    // foo01.cue and foo.mp3
    return 90;
  }
  if (cueSheetFileStem.includes(audioFileStem)) {
    // foo.cue and foo01.mp3
    return 80;
  }
  return 0;
}

function compareAudioForImage(
  imageFile: File,
  audioFile1: ResolvedUploadFileAudio | ResolvedUploadFileAudioWithCueSheet,
  audioFile2: ResolvedUploadFileAudio | ResolvedUploadFileAudioWithCueSheet
): number {
  const score1 = calcImageAndAudioRelationScore(imageFile, audioFile1);
  const score2 = calcImageAndAudioRelationScore(imageFile, audioFile2);
  if (score1 !== score2) {
    return score2 - score1;
  }

  const typeScore1 = audioFile1.type === 'audioWithCueSheet' ? 1 : 0;
  const typeScore2 = audioFile2.type === 'audioWithCueSheet' ? 1 : 0;
  return (
    typeScore2 - typeScore1 ||
    compareString(audioFile1.file.name, audioFile2.file.name)
  );
}

function getSourceFileType2(file: File): SourceFileType | 'unknown' {
  const typeByFilename = getSourceFileType(file.name);
  if (typeByFilename) {
    return typeByFilename;
  }

  if (file.type.startsWith('audio/')) {
    return 'audio';
  }

  if (file.type.startsWith('image/')) {
    return 'image';
  }

  return 'unknown';
}

function resolveUploadFilesImpl(files: readonly File[]): ResolvedUploadFile[] {
  const typeAndFiles = files.map(
    (file) => [getSourceFileType2(file), file] as const
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

  // CUE??????????????????????????????????????????????????????
  const resAudioWithCueSheetFiles: ResolvedUploadFileAudioWithCueSheet[] = [];
  for (const audioFile of audioFileSet) {
    if (
      !LOSSLESS_AUDIO_FILE_EXTENSION_SET.has(
        getExtension(audioFile[1].name).toLowerCase()
      )
    ) {
      continue;
    }

    // ?????????CUE???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
    const cueSheetFiles = Array.from(cueSheetFileSet)
      .map(
        (item) =>
          [
            item,
            calcCueSheetAndAudioRelationScore(item[1].name, audioFile[1].name),
          ] as const
      )
      .filter(([, score]) => score > 0)
      .sort(([, score1], [, score2]) => score2 - score1);
    const cueSheetFile = cueSheetFiles[0]?.[0];
    if (!cueSheetFile) {
      continue;
    }

    resAudioWithCueSheetFiles.push({
      id: generateFileId(),
      type: 'audioWithCueSheet',
      file: audioFile[1],
      cueSheetFile: cueSheetFile[1],
    });

    audioFileSet.delete(audioFile);
    cueSheetFileSet.delete(cueSheetFile);
  }

  // TODO: ???????????????????????????????????????????????????????????????????????????

  // ???????????????????????????????????????
  const resAudioFiles: ResolvedUploadFileAudio[] = [];
  for (const audioFile of audioFileSet) {
    resAudioFiles.push({
      id: generateFileId(),
      type: 'audio',
      file: audioFile[1],
    });

    audioFileSet.delete(audioFile);
  }

  // ?????????????????????????????????????????????????????????
  const resImageFiles: ResolvedUploadFileImage[] = [];
  for (const imageFile of imageFileSet) {
    const imageTargetAudioFile = [
      ...resAudioWithCueSheetFiles,
      ...resAudioFiles,
    ].sort((a, b) => compareAudioForImage(imageFile[1], a, b))[0];

    if (!imageTargetAudioFile) {
      continue;
    }

    resImageFiles.push({
      id: generateFileId(),
      type: 'image',
      file: imageFile[1],
      dependsOn: imageTargetAudioFile.id,
    });

    imageFileSet.delete(imageFile);
  }

  // ?????????????????????????????????
  const resUnknownFiles: ResolvedUploadFileUnsupported[] = [];
  for (const file of [
    ...audioFileSet,
    ...cueSheetFileSet,
    ...imageFileSet,
    ...unknownFileSet,
  ]) {
    resUnknownFiles.push({
      id: generateFileId(),
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
  fileId: ResolvedFileId
): ResolvedUploadFile[] {
  return originalFiles
    .filter((uploadFile) => uploadFile.id !== fileId)
    .map((uploadFile) => {
      if (uploadFile.type === 'image' && uploadFile.dependsOn === fileId) {
        return {
          ...uploadFile,
          type: 'unknown',
          dependsOn: null,
        };
      }
      return uploadFile;
    });
}
