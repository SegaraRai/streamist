import { acceptHMRUpdate, defineStore } from 'pinia';
import type { SourceFileAttachToType } from '$shared/types/db';
import { FileId, UploadFile, UploadManager } from '~/logic/uploadManager';
import {
  ResolvedFileId,
  ResolvedUploadFile,
  removeUploadFile,
  resolveUploadFiles,
} from '~/logic/uploadResolver';

export const useUploadStore = defineStore('upload', () => {
  const stagedFiles = ref<ResolvedUploadFile[]>([]);
  const files = ref<readonly UploadFile[]>([]);

  const manager = new UploadManager();
  const syncFiles = () => {
    files.value = manager.files.map((file) => ({ ...file }));
  };
  manager.addEventListener('update', (): void => {
    syncFiles();
  });
  syncFiles();

  window.addEventListener('beforeunload', (event): void => {
    if (manager.ongoingUploadExists || manager.queuedUploadExists) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  return {
    stagedFiles,
    files,
    stageFiles(files: readonly File[]): void {
      stagedFiles.value.push(...resolveUploadFiles(files));
    },
    startUpload(): void {
      manager.addResolvedFiles(stagedFiles.value.splice(0));
    },
    uploadImageFiles(
      files: readonly File[],
      attachToType: SourceFileAttachToType,
      attachToId: string
    ): FileId[] {
      return files.map((file) =>
        manager.addImageFileWithAttachTarget(file, attachToType, attachToId)
      );
    },
    removeStagingFile(fileId: ResolvedFileId): void {
      stagedFiles.value.push(
        ...removeUploadFile(stagedFiles.value.splice(0), fileId)
      );
    },
    removeFile(fileId: FileId): void {
      manager.removeFile(fileId);
    },
    clearAll(): void {
      stagedFiles.value.splice(0);
      for (const file of manager.files) {
        try {
          manager.removeFile(file.id);
        } catch (_error: unknown) {
          // ignore
        }
      }
    },
    canClearAll: computed(() => {
      if (stagedFiles.value.length > 0) {
        return true;
      }
      return manager.files.some((file) => manager.canRemoveFile(file));
    }),
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUploadStore, import.meta.hot));
}
