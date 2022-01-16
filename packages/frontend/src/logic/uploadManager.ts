import PQueue from 'p-queue';
import {
  MAX_SOURCE_AUDIO_FILE_SIZE_PER_PLAN,
  MAX_SOURCE_CUE_SHEET_FILE_SIZE_PER_PLAN,
  MAX_SOURCE_IMAGE_FILE_SIZE_PER_PLAN,
  MIN_SOURCE_FILE_SIZE,
  Plan,
  SOURCE_FILE_CACHE_CONTROL,
  SOURCE_FILE_CONTENT_ENCODING,
  SOURCE_FILE_CONTENT_TYPE,
} from '$shared/config';
import { parseCueSheet } from '$shared/cueParser';
import { validateCueSheet } from '$shared/cueSheetCheck';
import { decodeText } from '$shared/decodeText';
import { retryUpload } from '$shared/retry';
import type {
  SourceFileAttachToType,
  SourceFileState,
  SourceFileType,
} from '$shared/types';
import type {
  CreateSourceResponse,
  CreateSourceResponseFile,
  ResourceSourceFile,
  ResourceUser,
  UploadURL,
} from '$/types';
import type { VSourceCreateBodyWrapper } from '$/validators';
import { db } from '~/db';
import api from '~/logic/api';
import type {
  ResolvedFileId,
  ResolvedUploadFile,
} from '~/logic/uploadResolver';

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
  // 最終状態: アップロードに失敗した
  | 'error_upload_failed'
  // 最終状態: アップロードは完了したがトランスコードに失敗した
  | 'error_transcode_failed'
  // 最終状態: ユーザーがアップロードを取り消した
  | 'error_aborted'
  // 最終状態: 依存先ファイルがトランスコードに失敗したのでスキップされた（未対応ファイルはそもそも追加されない）
  // または、CUEシートが不正or未対応の形式であったため音声ファイルのアップロードがスキップされた
  | 'skipped'
  // ユーザーがアップロードを取り消した、または処理が完了（成功or失敗）した後ユーザーが削除した
  // 参照用にファイルリストには残り続けるが、UIでは表示しない
  | 'removed';

export type FileId = symbol;

export interface UploadInfo {
  sourceId: string;
  sourceFileId: string;
  url: UploadURL;
}

export interface UploadFile {
  id: FileId;
  /** 先にアップロード及びトランスコードしないといけないファイルのID */
  dependsOn: FileId | null;
  /**
   * 同じグループのファイルID \
   * いずれかのファイルの検証に失敗した場合、このグループのファイルは全てスキップされる
   */
  groups: FileId[];
  status: UploadStatus;
  /** DBのSourceFileから取得した場合null */
  file: File | null;
  filename: string;
  fileSize: number;
  fileType: SourceFileType | 'imageWithAttachTarget' | 'unknown';
  createdAt: number;
  uploadBeginAt: number | null;
  uploadEndAt: number | null;
  uploadInfo: UploadInfo | null;
  uploadedSize: number | null;
  createSourcePromise: Promise<CreateSourceResponse> | null;
  attachTarget: {
    attachToType: SourceFileAttachToType;
    attachToId: string;
    attachPrepend: boolean;
  } | null;
}

export class UploadError extends Error {
  constructor(
    message: string,
    readonly newStatus: UploadStatus = 'error_upload_failed'
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

function generateFileId(): FileId {
  return Symbol('upload-file-id');
}

function createAudioUploadFile(audioFile: File): UploadFile {
  return {
    id: generateFileId(),
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
    uploadedSize: null,
    createSourcePromise: null,
    attachTarget: null,
  };
}

function createAudioWithCueSheetUploadFile(
  audioFile: File,
  cueSheetFile: File
): [audioUploadFile: UploadFile, cueSheetUploadFile: UploadFile] {
  const audioFileId = generateFileId();
  const cueSheetFileId = generateFileId();
  return [
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
      uploadedSize: null,
      createSourcePromise: null,
      attachTarget: null,
    },
    {
      id: cueSheetFileId,
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
      uploadedSize: null,
      createSourcePromise: null,
      attachTarget: null,
    },
  ];
}

function createImageUploadFile(imageFile: File, dependsOn: FileId): UploadFile {
  return {
    id: generateFileId(),
    dependsOn,
    groups: [],
    status: 'pending',
    file: imageFile,
    filename: imageFile.name,
    fileSize: imageFile.size,
    fileType: 'image',
    createdAt: Date.now(),
    uploadBeginAt: null,
    uploadEndAt: null,
    uploadInfo: null,
    uploadedSize: null,
    createSourcePromise: null,
    attachTarget: null,
  };
}

function createImageWithAttachTargetUploadFile(
  imageFile: File,
  attachToType: SourceFileAttachToType,
  attachToId: string,
  attachPrepend = false
): UploadFile {
  return {
    id: generateFileId(),
    dependsOn: null,
    groups: [],
    status: 'pending',
    file: imageFile,
    filename: imageFile.name,
    fileSize: imageFile.size,
    fileType: 'imageWithAttachTarget',
    createdAt: Date.now(),
    uploadBeginAt: null,
    uploadEndAt: null,
    uploadInfo: null,
    uploadedSize: null,
    createSourcePromise: null,
    attachTarget: {
      attachToType,
      attachToId,
      attachPrepend,
    },
  };
}

function createUnknownUploadFile(file: File): UploadFile {
  return {
    id: generateFileId(),
    dependsOn: null,
    groups: [],
    status: 'pending',
    file,
    filename: file.name,
    fileSize: file.size,
    fileType: 'unknown',
    createdAt: Date.now(),
    uploadBeginAt: null,
    uploadEndAt: null,
    uploadInfo: null,
    uploadedSize: null,
    createSourcePromise: null,
    attachTarget: null,
  };
}

function createUploadFilesFromResolvedFiles(
  files: readonly ResolvedUploadFile[]
): UploadFile[] {
  const uploadFiles: UploadFile[] = [];
  const audioFileIdToFileIdMap = new Map<ResolvedFileId, FileId>();

  for (const file of files) {
    switch (file.type) {
      case 'audio': {
        const uploadFile = createAudioUploadFile(file.file);
        uploadFiles.push(uploadFile);
        audioFileIdToFileIdMap.set(file.id, uploadFile.id);
        break;
      }

      case 'audioWithCueSheet': {
        const [audioUploadFile, cueSheetUploadFile] =
          createAudioWithCueSheetUploadFile(file.file, file.cueSheetFile);
        uploadFiles.push(audioUploadFile, cueSheetUploadFile);
        audioFileIdToFileIdMap.set(file.id, audioUploadFile.id);
        break;
      }

      case 'unknown':
        uploadFiles.push(createUnknownUploadFile(file.file));
        break;
    }
  }

  for (const file of files) {
    if (file.type !== 'image') {
      continue;
    }

    const targetAudioFileId = audioFileIdToFileIdMap.get(file.dependsOn);
    if (!targetAudioFileId) {
      // should not occur
      console.error(
        'logic error: image file depends on unknown audio file @createUploadFilesFromResolvedFiles'
      );
      uploadFiles.push(createUnknownUploadFile(file.file));
    } else {
      uploadFiles.push(createImageUploadFile(file.file, targetAudioFileId));
    }
  }

  // sort
  const fileToIndexMap: ReadonlyMap<File, number> = new Map(
    files.flatMap((file, index) =>
      file.type === 'audioWithCueSheet'
        ? [
            [file.file, index],
            [file.cueSheetFile, index + 0.5],
          ]
        : [[file.file, index]]
    )
  );
  uploadFiles.sort(
    (a, b) =>
      (fileToIndexMap.get(a.file!) ?? 1e7) -
      (fileToIndexMap.get(b.file!) ?? 1e7)
  );

  return uploadFiles;
}

function isValidAudioFile(plan: Plan, audioFile: File): Promise<boolean> {
  return Promise.resolve(
    MIN_SOURCE_FILE_SIZE <= audioFile.size &&
      audioFile.size <= MAX_SOURCE_AUDIO_FILE_SIZE_PER_PLAN[plan]
  );
}

async function isValidCueSheetFile(
  plan: Plan,
  cueSheetFile: File
): Promise<boolean> {
  if (
    cueSheetFile.size < MIN_SOURCE_FILE_SIZE ||
    cueSheetFile.size > MAX_SOURCE_CUE_SHEET_FILE_SIZE_PER_PLAN[plan]
  ) {
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

function isValidImageFile(plan: Plan, imageFile: File): Promise<boolean> {
  return Promise.resolve(
    MIN_SOURCE_FILE_SIZE <= imageFile.size &&
      imageFile.size <= MAX_SOURCE_IMAGE_FILE_SIZE_PER_PLAN[plan]
  );
}

function doUpload(
  url: string,
  blob: Blob,
  onProgress: (size: number) => void
): Promise<string> {
  const onProgressNoThrow = (size: number) => {
    try {
      onProgress(size);
    } catch (error) {
      console.error(error);
    }
  };

  return new Promise((resolve, reject): void => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.onload = (): void => {
      xhr.onload = null;
      xhr.onerror = null;
      xhr.upload.onprogress = null;

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgressNoThrow(blob.size);
        resolve(xhr.getResponseHeader('ETag') || '');
      } else {
        reject(new Error(`Failed to upload file: ${xhr.status}`));
      }
    };
    xhr.onerror = (error): void => {
      xhr.onload = null;
      xhr.onerror = null;
      xhr.upload.onprogress = null;

      reject(new Error(`Failed to upload file: ${xhr.status} ${error}`));
    };
    xhr.upload.onprogress = (event): void => {
      onProgressNoThrow(event.loaded);
    };
    xhr.setRequestHeader('Cache-Control', SOURCE_FILE_CACHE_CONTROL);
    xhr.setRequestHeader('Content-Encoding', SOURCE_FILE_CONTENT_ENCODING);
    xhr.setRequestHeader('Content-Type', SOURCE_FILE_CONTENT_TYPE);
    xhr.send(blob);
  });
}

function doUploadWithRetry(
  url: string,
  blob: Blob,
  onProgress: (size: number) => void
): Promise<string> {
  return retryUpload(() => doUpload(url, blob, onProgress));
}

export class UploadManager extends EventTarget {
  private _files: UploadFile[] = [];

  private _createSourceQueue = new PQueue({
    concurrency: 2,
  });

  private _beginUploadQueue = new PQueue({
    concurrency: 4,
  });

  private uploadQueue = new PQueue({
    concurrency: 4,
  });

  private _dispatchUpdateEvent(): void {
    this.dispatchEvent(new CustomEvent('update', { detail: this._files }));
  }

  private _dispatchDBUpdateEvent(): void {
    this.dispatchEvent(new CustomEvent('dbUpdate'));
  }

  private _checkFile(plan: Plan, file: UploadFile): void {
    let checkPromise: Promise<boolean>;
    if (file.file) {
      switch (file.fileType) {
        case 'audio':
          checkPromise = isValidAudioFile(plan, file.file);
          break;

        case 'cueSheet':
          checkPromise = isValidCueSheetFile(plan, file.file);
          break;

        case 'image':
        case 'imageWithAttachTarget':
          checkPromise = isValidImageFile(plan, file.file);
          break;

        case 'unknown':
          checkPromise = Promise.resolve(false);
          break;
      }
    } else {
      checkPromise = Promise.resolve(false);
    }

    checkPromise.then((isValid) => {
      file.status = isValid ? 'validated' : 'error_invalid';
      this._dispatchUpdateEvent();
      this._tick();
    });
  }

  needsDBSync(): boolean {
    // NOTE: アップロードについてはこのセッションが持つファイルについてのみ考慮する（他のセッションのファイルについてはそれらに更新を任せる）
    // トランスコードについてはセッションを離れる可能性を考えてこのセッション以外のファイルについても考慮する
    return this._files.some((file) => file.status === 'transcoding');
  }

  sync(sourceFiles: readonly ResourceSourceFile[]): void {
    const sourceFileMap = new Map<string, ResourceSourceFile>(
      sourceFiles.map((sourceFile) => [sourceFile.id, sourceFile])
    );

    let changed = false;
    for (const file of this._files) {
      const sourceFileId = file.uploadInfo?.sourceFileId;
      if (!sourceFileId) {
        continue;
      }

      const sourceFile = sourceFileMap.get(sourceFileId);
      if (!sourceFile) {
        // should not occur
        console.error(
          'logic error: sourceFile does not exist on database @_sync',
          sourceFileId
        );
        continue;
      }

      let newStatus: UploadStatus | undefined;

      switch (sourceFile.state as SourceFileState) {
        case 'transcoded':
          newStatus = 'transcoded';
          break;

        case 'failed':
        case 'not_transcoded':
          newStatus = 'error_transcode_failed';
          break;
      }

      if (!file.file) {
        switch (sourceFile.state as SourceFileState) {
          case 'uploaded':
          case 'transcoding':
            newStatus = 'transcoding';
            break;

          case 'not_uploaded':
            newStatus = 'error_upload_failed';
            break;

          case 'aborted':
            newStatus = 'error_aborted';
            break;
        }
      }

      if (!newStatus || file.status === newStatus) {
        continue;
      }

      file.status = newStatus;
      changed = true;
    }

    // add unregistered files
    const registeredSourceFileIdSet = new Set(
      this._files.map((file) => file.uploadInfo?.sourceFileId)
    );
    for (const sourceFile of sourceFiles) {
      if (registeredSourceFileIdSet.has(sourceFile.id)) {
        continue;
      }

      const state = sourceFile.state as SourceFileState;
      if (
        state !== 'uploading' &&
        state !== 'uploaded' &&
        state !== 'transcoding'
      ) {
        continue;
      }

      const fileType = sourceFile.type as SourceFileType;
      if (fileType === 'cueSheet') {
        continue;
      }

      if (sourceFile.cueSheetFileId) {
        const cueSheetSourceFile = sourceFileMap.get(sourceFile.cueSheetFileId);
        if (cueSheetSourceFile) {
          this._files.unshift({
            id: generateFileId(),
            dependsOn: null,
            groups: [],
            status: state,
            file: null,
            filename: cueSheetSourceFile.filename,
            fileSize: cueSheetSourceFile.fileSize,
            fileType: 'cueSheet',
            createdAt: cueSheetSourceFile.createdAt,
            uploadBeginAt: cueSheetSourceFile.createdAt,
            uploadEndAt: cueSheetSourceFile.uploadedAt,
            uploadInfo: {
              sourceFileId: cueSheetSourceFile.id,
              sourceId: cueSheetSourceFile.sourceId,
              url: {
                url: null,
                size: cueSheetSourceFile.fileSize,
                parts: [],
              },
            },
            uploadedSize: null,
            createSourcePromise: null,
            attachTarget: null,
          });
        }
      }

      this._files.unshift({
        id: generateFileId(),
        dependsOn: null,
        groups: [],
        status: state,
        file: null,
        filename: sourceFile.filename,
        fileSize: sourceFile.fileSize,
        fileType,
        createdAt: sourceFile.createdAt,
        uploadBeginAt: sourceFile.createdAt,
        uploadEndAt: sourceFile.uploadedAt,
        uploadInfo: {
          sourceFileId: sourceFile.id,
          sourceId: sourceFile.sourceId,
          url: {
            url: null,
            size: sourceFile.fileSize,
            parts: [],
          },
        },
        uploadedSize: null,
        createSourcePromise: null,
        attachTarget: null,
      });

      changed = true;
    }

    if (changed) {
      this._dispatchUpdateEvent();
      this._tick();
    }
  }

  private _upload(
    url: UploadURL,
    file: Blob,
    onProgress: (size: number) => void
  ): Promise<string[] | void> {
    if (url.parts) {
      const uploadedSizes: number[] = new Array(url.parts.length).fill(0);
      const eTagPromises: Promise<string>[] = [];
      let failed = false;
      let offset = 0;
      for (const [partIndex, part] of url.parts.entries()) {
        const partBlob = file.slice(offset, offset + part.size);
        offset += part.size;

        eTagPromises.push(
          this.uploadQueue.add(async () => {
            if (failed) {
              return '';
            }

            try {
              const eTag = await doUploadWithRetry(
                part.url,
                partBlob,
                (size: number): void => {
                  uploadedSizes[partIndex] = size;
                  onProgress(
                    uploadedSizes.reduce((acc, cur): number => acc + cur, 0)
                  );
                }
              );

              uploadedSizes[partIndex] = part.size;

              return eTag;
            } catch (error: unknown) {
              failed = true;
              throw error;
            }
          })
        );
      }
      return Promise.all(eTagPromises);
    } else {
      return this.uploadQueue.add(async (): Promise<void> => {
        await doUploadWithRetry(url.url, file, onProgress);
      });
    }
  }

  /**
   * - 依存先が失敗したファイルを探し、状態をskippedにする
   * - アップロード可能なファイルを探し、アップロードを開始する
   */
  private _tick(): void {
    const fileMap: ReadonlyMap<FileId, UploadFile> = new Map(
      this._files.map((file) => [file.id, file])
    );

    let outerChanged = false;
    while (true) {
      let changed = false;
      for (const file of this._files) {
        // DBから取得したものについては一切処理しない（ここで切らなくても処理されることはないはずだが一応）
        if (!file.file) {
          continue;
        }

        const dependency = file.dependsOn ? fileMap.get(file.dependsOn)! : null;
        const groups = file.groups.map((fileId) => fileMap.get(fileId)!);

        switch (file.status) {
          case 'pending':
            file.status = 'validating';
            {
              let user: ResourceUser | undefined;
              try {
                user =
                  JSON.parse(localStorage.getItem('db.user') || 'null') ||
                  undefined;
              } catch (error) {
                console.warn(error);
              }
              this._checkFile((user?.plan as Plan | undefined) ?? 'free', file);
            }
            changed = true;
            break;

          case 'validated':
            if (
              groups.some(
                (group) =>
                  group.status === 'error_invalid' ||
                  group.status === 'error_upload_failed' ||
                  group.status === 'error_transcode_failed' ||
                  group.status === 'skipped' ||
                  group.status === 'removed'
              )
            ) {
              // 構成するファイルのうちいずれかが失敗した場合はこのファイルをスキップ
              file.status = 'skipped';
              changed = true;
              break;
            }

            if (dependency) {
              // 依存ファイルが失敗したorスキップされた場合はこのファイルをスキップ
              if (
                dependency.status === 'error_invalid' ||
                dependency.status === 'error_upload_failed' ||
                dependency.status === 'error_transcode_failed' ||
                dependency.status === 'skipped' ||
                dependency.status === 'removed'
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
            if (
              groups.some(
                (group) =>
                  group.status === 'pending' || group.status === 'validating'
              )
            ) {
              break;
            }

            // アップロードを開始（キューに貯める）

            file.status = 'queued';
            changed = true;

            this._beginUploadQueue.add(async () => {
              try {
                if (file.status === 'removed') {
                  // aborted by user
                  return;
                }

                file.status = 'uploading';
                file.uploadBeginAt = Date.now();
                this._dispatchUpdateEvent();

                let requestFileType:
                  | CreateSourceResponseFile['requestFile']['type']
                  | undefined;
                let createSourcePromise:
                  | Promise<CreateSourceResponse>
                  | undefined;

                if (
                  (file.fileType === 'audio' || file.fileType === 'cueSheet') &&
                  file.groups.length > 0
                ) {
                  // CUE+WAV
                  requestFileType = file.fileType;
                  createSourcePromise =
                    file.groups
                      .map((fileId) => fileMap.get(fileId)!.createSourcePromise)
                      .find((x) => x) ?? undefined;
                  if (!createSourcePromise) {
                    const otherFile = fileMap.get(file.groups[0])!;
                    const audioFile =
                      file.fileType === 'audio' ? file : otherFile;
                    const cueSheetFile =
                      file.fileType === 'cueSheet' ? file : otherFile;
                    const body: VSourceCreateBodyWrapper['!payload'] = {
                      type: 'audio',
                      // TODO(prod): set region
                      region: 'ap-northeast-1',
                      audioFile: {
                        type: 'audio',
                        filename: audioFile.filename,
                        fileSize: audioFile.fileSize,
                      },
                      cueSheetFile: {
                        type: 'cueSheet',
                        filename: cueSheetFile.filename,
                        fileSize: cueSheetFile.fileSize,
                      },
                    };
                    createSourcePromise = this._createSourceQueue.add(() =>
                      api.my.sources.$post({
                        body,
                      })
                    );
                    file.createSourcePromise = createSourcePromise;
                  }
                } else if (file.fileType === 'audio') {
                  requestFileType = 'audio';
                  const body: VSourceCreateBodyWrapper['!payload'] = {
                    type: 'audio',
                    // TODO(prod): set region
                    region: 'ap-northeast-1',
                    audioFile: {
                      type: 'audio',
                      filename: file.filename,
                      fileSize: file.fileSize,
                    },
                    cueSheetFile: null,
                  };
                  createSourcePromise = this._createSourceQueue.add(() =>
                    api.my.sources.$post({
                      body,
                    })
                  );
                } else if (file.fileType === 'image') {
                  const targetAudioFileSourceFileId = fileMap.get(
                    file.dependsOn!
                  )?.uploadInfo?.sourceFileId;
                  if (!targetAudioFileSourceFileId) {
                    throw new UploadError(
                      'targetAudioFileSourceFileId not found',
                      'skipped'
                    );
                  }

                  const targetTrack = await db.tracks
                    .filter(
                      (x) => x.sourceFileId === targetAudioFileSourceFileId
                    )
                    .first();
                  const targetAlbumId = targetTrack?.albumId;
                  if (!targetAlbumId) {
                    throw new UploadError('targetTrack not found', 'skipped');
                  }

                  requestFileType = 'image';
                  const body: VSourceCreateBodyWrapper['!payload'] = {
                    type: 'image',
                    // TODO(prod): set region
                    region: 'ap-northeast-1',
                    imageFile: {
                      type: 'image',
                      filename: file.filename,
                      fileSize: file.fileSize,
                    },
                    attachToType: 'album',
                    attachToId: targetAlbumId,
                    attachPrepend: false,
                  };
                  createSourcePromise = this._createSourceQueue.add(() =>
                    api.my.sources.$post({
                      body,
                    })
                  );
                } else if (file.fileType === 'imageWithAttachTarget') {
                  if (!file.attachTarget) {
                    throw new UploadError(
                      'logic error: no attach target specified'
                    );
                  }

                  requestFileType = 'image';
                  const body: VSourceCreateBodyWrapper['!payload'] = {
                    type: 'image',
                    // TODO(prod): set region
                    region: 'ap-northeast-1',
                    imageFile: {
                      type: 'image',
                      filename: file.filename,
                      fileSize: file.fileSize,
                    },
                    attachToType: file.attachTarget.attachToType,
                    attachToId: file.attachTarget.attachToId,
                    attachPrepend: file.attachTarget.attachPrepend,
                  };
                  createSourcePromise = this._createSourceQueue.add(() =>
                    api.my.sources.$post({
                      body,
                    })
                  );
                }

                if (!createSourcePromise || !requestFileType) {
                  // should not occur
                  throw new UploadError(
                    'logic error: cannot create createSourcePromise or requestFileType'
                  );
                }

                const createSourceResponse = await createSourcePromise;

                this._dispatchDBUpdateEvent();

                const responseFile = createSourceResponse.files.find(
                  (resFile) => resFile.requestFile.type === requestFileType
                );
                if (!responseFile) {
                  // should not occur
                  throw new UploadError(
                    'cannot create createSourcePromise (cannot associate response file with request file)'
                  );
                }

                const { sourceId } = createSourceResponse;
                const { sourceFileId, uploadURL } = responseFile;

                file.uploadInfo = {
                  sourceId,
                  sourceFileId,
                  url: uploadURL,
                };

                const eTags = await this._upload(
                  uploadURL,
                  file.file!,
                  (size: number) => {
                    file.uploadedSize = size;
                    this._dispatchUpdateEvent();
                  }
                );

                file.status = 'uploaded';
                file.uploadEndAt = Date.now();
                this._dispatchUpdateEvent();

                await api.my.sources
                  ._sourceId(sourceId)
                  .files._sourceFileId(sourceFileId)
                  .$patch({
                    body: {
                      state: 'uploaded',
                      parts: eTags ?? undefined,
                    },
                  });

                file.status = 'transcoding';
                this._dispatchUpdateEvent();
                this._dispatchDBUpdateEvent();
              } catch (error: unknown) {
                console.error('failed to upload', file, error);
                file.status =
                  error instanceof UploadError
                    ? error.newStatus
                    : 'error_upload_failed';
                this._dispatchUpdateEvent();
              }
            });

            break;
        }
      }

      if (!changed) {
        break;
      }

      outerChanged = true;
    }

    if (outerChanged) {
      this._dispatchUpdateEvent();
    }
  }

  get files(): readonly UploadFile[] {
    return this._files;
  }

  get queuedUploadExists(): boolean {
    return this._files.some(
      (file) =>
        file.status === 'pending' ||
        file.status === 'validating' ||
        file.status === 'validated' ||
        file.status === 'queued'
    );
  }

  get ongoingUploadExists(): boolean {
    return this._files.some(
      (file) =>
        file.file && (file.status === 'uploading' || file.status === 'uploaded')
    );
  }

  addAudioFile(audioFile: File): FileId {
    const uploadFile = createAudioUploadFile(audioFile);
    this._files.unshift(uploadFile);
    this._dispatchUpdateEvent();
    this._tick();
    return uploadFile.id;
  }

  addAudioFileWithCueSheet(
    audioFile: File,
    cueSheetFile: File
  ): [audioFileId: FileId, cueSheetFileId: FileId] {
    const [audioUploadFile, cueSheetUploadFile] =
      createAudioWithCueSheetUploadFile(audioFile, cueSheetFile);
    this._files.unshift(audioUploadFile, cueSheetUploadFile);
    this._dispatchUpdateEvent();
    this._tick();
    return [audioUploadFile.id, cueSheetUploadFile.id];
  }

  addImageFile(imageFile: File, dependsOn: FileId): FileId {
    if (this._files.every((file) => file.id !== dependsOn)) {
      throw new Error('invalid dependsOn');
    }
    const uploadFile = createImageUploadFile(imageFile, dependsOn);
    this._files.unshift(uploadFile);
    this._dispatchUpdateEvent();
    this._tick();
    return uploadFile.id;
  }

  addImageFileWithAttachTarget(
    imageFile: File,
    attachToType: SourceFileAttachToType,
    attachToId: string,
    attachPrepend = false
  ): FileId {
    const uploadFile = createImageWithAttachTargetUploadFile(
      imageFile,
      attachToType,
      attachToId,
      attachPrepend
    );
    this._files.unshift(uploadFile);
    this._dispatchUpdateEvent();
    this._tick();
    return uploadFile.id;
  }

  addUnknownFile(file: File): FileId {
    const uploadFile = createUnknownUploadFile(file);
    this._files.unshift(uploadFile);
    this._dispatchUpdateEvent();
    this._tick();
    return uploadFile.id;
  }

  addResolvedFiles(files: readonly ResolvedUploadFile[]): void {
    const uploadFiles = createUploadFilesFromResolvedFiles(files);
    this._files.unshift(...uploadFiles);
    this._dispatchUpdateEvent();
    this._tick();
  }

  canRemoveFile(file: UploadFile): boolean {
    switch (file.status) {
      case 'pending':
      case 'validating':
      case 'validated':
      case 'queued':
      case 'transcoded':
      case 'skipped':
      case 'error_invalid':
      case 'error_upload_failed':
      case 'error_transcode_failed':
        return true;
    }

    return false;
  }

  /**
   * @note `status`がpending, validating, validated, queued, transcoded, error_invalid, error_upload_failed, error_transcode_failed, skippedのいずれかでないといけない
   */
  removeFile(fileId: FileId): void {
    const uploadFileIndex = this._files.findIndex((x) => x.id === fileId);
    if (uploadFileIndex < 0) {
      return;
    }

    const uploadFile = this._files[uploadFileIndex];
    if (!this.canRemoveFile(uploadFile)) {
      return;
    }

    uploadFile.status = 'removed';
    this._dispatchUpdateEvent();
    this._tick();
  }
}
