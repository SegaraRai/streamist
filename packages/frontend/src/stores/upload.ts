import { acceptHMRUpdate, defineStore } from 'pinia';
import { UploadFile, UploadManager } from '~/logic/uploadManager';
import { ResolvedUploadFile, resolveUploadFiles } from '~/logic/uploadResolver';

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
    addFiles(files: readonly File[]): void {
      stagedFiles.value.push(...resolveUploadFiles(files));
    },
    startUpload(): void {
      manager.addResolvedFiles(stagedFiles.value.splice(0));
    },
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUploadStore, import.meta.hot));
}
