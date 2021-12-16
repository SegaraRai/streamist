import { parseCueSheet } from '$shared/cueParser';
import { validateCueSheet } from '$shared/cueSheetCheck';
import { decodeText } from '$shared/decodeText';
import {
  MAX_SOURCE_AUDIO_FILE_SIZE,
  MAX_SOURCE_IMAGE_FILE_SIZE,
} from '$shared/sourceFileConfig';
import type { SourceFileType } from '$shared/types/db';
import api from '@/logic/api';
import type { UploadURL } from '$/types';

// CUE+WAV等の場合: CUEシートチェック→CUE&WAVアップロード
// MP3+JPG等の場合: MP3アップロード→（成功時）JPGアップロード

export type UploadStatus =
  // 初期状態
  | 'pending'
  // ファイルがアップロードできる形式かどうか検証中
  | 'validating'
  // チェック完了、次のtickでqueuedに変わる
  | 'validated'
  // 他のファイルのアップロードを待機している
  | 'queued'
  // アップロード中
  | 'uploading'
  // アップロードが完了し、構成する他のファイルのアップロードを待っている（CUE+WAV等、複数ファイルからなる場合）
  | 'uploaded'
  // 構成するファイルがすべてアップロードされ、トランスコードが開始された
  | 'transcoding'
  // 最終状態: 正常にトランスコードが終了した
  | 'transcoded'
  // 最終状態: 事前チェックに失敗した
  | 'error_invalid'
  // 最終状態: アップロードは完了したがトランスコードに失敗した
  | 'error_failed'
  // 最終状態: 依存先ファイルがトランスコードに失敗したのでスキップされた（未対応ファイルはそもそも追加されない）
  // または、CUEシートが不正or未対応の形式であったため音声ファイルのアップロードがスキップされた
  | 'skipped';

interface UploadInfo {
  sourceId: string;
  sourceFileId: string;
  url: UploadURL;
}

interface UploadFile {
  id: symbol;
  /** 先にアップロード及びトランスコードしないといけないファイルのID */
  dependsOn: symbol | null;
  /**
   * 同じグループのファイルID \
   * いずれかのファイルの検証に失敗した場合、このグループのファイルは全てスキップされる
   */
  groups: symbol[];
  status: UploadStatus;
  file: File;
  filename: string;
  fileSize: number;
  fileType: SourceFileType;
  createdAt: number;
  uploadBeginAt: number | null;
  uploadEndAt: number | null;
  uploadInfo: UploadInfo | null;
}

function generateFileId(): symbol {
  return Symbol('upload-file-id');
}

function isValidAudioFile(audioFile: File): Promise<boolean> {
  return Promise.resolve(audioFile.size <= MAX_SOURCE_AUDIO_FILE_SIZE);
}

async function isValidCueSheetFile(cueSheetFile: File): Promise<boolean> {
  if (cueSheetFile.size > MAX_SOURCE_AUDIO_FILE_SIZE) {
    return false;
  }

  try {
    const text = decodeText(
      new Uint8Array(await new Blob([cueSheetFile]).arrayBuffer())
    );
    const cueSheet = parseCueSheet(text);
    validateCueSheet(cueSheet);
    return true;
  } catch (error) {
    console.warn(`Cue sheet file is not valid: ${error}`);
    return false;
  }
}

function isValidImageFile(imageFile: File): Promise<boolean> {
  return Promise.resolve(imageFile.size <= MAX_SOURCE_IMAGE_FILE_SIZE);
}

export class UploadManager extends EventTarget {
  private files: UploadFile[] = [];

  private _dispatchUpdatedEvent(): void {
    this.dispatchEvent(new CustomEvent('updated', { detail: this.files }));
  }

  private _checkFile(file: UploadFile): void {
    let checkPromise: Promise<boolean>;
    switch (file.fileType) {
      case 'audio':
        checkPromise = isValidAudioFile(file.file);
        break;

      case 'cueSheet':
        checkPromise = isValidCueSheetFile(file.file);
        break;

      case 'image':
        checkPromise = isValidImageFile(file.file);
        break;
    }

    checkPromise.then((isValid) => {
      file.status = isValid ? 'validated' : 'error_invalid';
      this._tick();
    });
  }

  /**
   * - 依存先が失敗したファイルを探し、状態をskippedにする
   * - アップロード可能なファイルを探し、アップロードを開始する
   */
  private _tick(): void {
    const fileMap: ReadonlyMap<symbol, UploadFile> = new Map(
      this.files.map((file) => [file.id, file])
    );

    while (true) {
      let changed = false;
      for (const file of this.files) {
        const dependency = file.dependsOn ? fileMap.get(file.dependsOn)! : null;
        const groups = file.groups.map((fileId) => fileMap.get(fileId)!);

        switch (file.status) {
          case 'pending':
            file.status = 'validating';
            this._checkFile(file);
            changed = true;
            break;

          case 'validated':
            if (groups.some((group) => group.status === 'error_invalid')) {
              // 構成するファイルのうちいずれかが失敗した場合はこのファイルをスキップ
              file.status = 'skipped';
              changed = true;
              break;
            }

            if (dependency) {
              // 依存ファイルが失敗したorスキップされた場合はこのファイルをスキップ
              if (
                dependency.status === 'error_invalid' ||
                dependency.status === 'error_failed' ||
                dependency.status === 'skipped'
              ) {
                file.status = 'skipped';
                changed = true;
                break;
              }
            }

            // 依存ファイルや構成するファイルが完了し次第アップロードを準備

            // 依存ファイルの処理が完了していない場合はまだ
            if (dependency && dependency.status !== 'transcoded') {
              break;
            }

            // 構成するファイルのチェックが終わっていない場合はまだ
            if (groups.some((group) => group.status !== 'validated')) {
              break;
            }

            file.status = 'queued';
            changed = true;

            break;

          case 'queued':
            file.status = 'uploading';
            file.uploadBeginAt = Date.now();
            // TODO: uploadURL取得、アップロード開始
            changed = true;
            // uploading→uploaded→transcoding→transcodedへの遷移はPromise内で行う
            break;
        }
      }

      if (!changed) {
        break;
      }
    }

    this._dispatchUpdatedEvent();
  }

  addAudioFile(audioFile: File): symbol {
    const audioFileId = generateFileId();

    this.files.push({
      id: audioFileId,
      dependsOn: null,
      groups: [],
      status: 'pending',
      file: audioFile,
      filename: audioFile.name,
      fileSize: audioFile.size,
      fileType: 'audio',
      createdAt: Date.now(),
      uploadBeginAt: null,
      uploadEndAt: null,
      uploadInfo: null,
    });

    this._dispatchUpdatedEvent();
    this._tick();

    return audioFileId;
  }

  addAudioFileWithCueSheet(
    audioFile: File,
    cueSheetFile: File
  ): [symbol, symbol] {
    const audioFileId = generateFileId();
    const cueSheetFileId = generateFileId();

    this.files.push(
      {
        id: audioFileId,
        dependsOn: null,
        groups: [cueSheetFileId],
        status: 'pending',
        file: audioFile,
        filename: audioFile.name,
        fileSize: audioFile.size,
        fileType: 'audio',
        createdAt: Date.now(),
        uploadBeginAt: null,
        uploadEndAt: null,
        uploadInfo: null,
      },
      {
        id: cueSheetFileId!,
        dependsOn: null,
        groups: [audioFileId],
        status: 'pending',
        file: cueSheetFile,
        filename: cueSheetFile.name,
        fileSize: cueSheetFile.size,
        fileType: 'cueSheet',
        createdAt: Date.now(),
        uploadBeginAt: null,
        uploadEndAt: null,
        uploadInfo: null,
      }
    );

    this._dispatchUpdatedEvent();
    this._tick();

    return [audioFileId, cueSheetFileId];
  }

  addImageFile(imageFile: File, dependsOn: symbol): symbol {
    const imageFileId = generateFileId();

    this.files.push({
      id: imageFileId,
      dependsOn,
      groups: [],
      status: 'pending',
      file: imageFile,
      filename: imageFile.name,
      fileSize: imageFile.size,
      fileType: 'audio',
      createdAt: Date.now(),
      uploadBeginAt: null,
      uploadEndAt: null,
      uploadInfo: null,
    });

    this._dispatchUpdatedEvent();
    this._tick();

    return imageFileId;
  }
}
