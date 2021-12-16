import { acceptHMRUpdate, defineStore } from 'pinia';
import type { SourceFileType } from '$shared/types/db';
import api from '@/logic/api';

// CUE+WAV等の場合: CUEシートチェック→CUE&WAVアップロード
// MP3+JPG等の場合: MP3アップロード→（成功時）JPGアップロード

export type UploadStatus =
  // ファイルがアップロードできる形式かどうか検証中
  | 'checking'
  // 他のファイルのアップロードを待機している
  | 'pending'
  // アップロード中
  | 'uploading'
  // アップロードが完了し、構成する他のファイルのアップロードを待っている（CUE+WAV等、複数ファイルからなる場合）
  | 'uploaded'
  // 構成するファイルがすべてアップロードされ、トランスコードが開始された
  | 'transcoding'
  // 最終状態: 正常にトランスコードが終了した
  | 'transcoded'
  // 最終状態: アップロードは完了したがトランスコードに失敗した
  | 'error'
  // 最終状態: 依存先ファイルがトランスコードに失敗したのでスキップされた（未対応ファイルはそもそも追加されない）
  // または、CUEシートが不正or未対応の形式であったため音声ファイルのアップロードがスキップされた
  | 'skipped';

interface UploadFile {
  id: symbol;
  status: UploadStatus;
  file: File;
  filename: string;
  fileSize: number;
  fileType: SourceFileType;
  createdAt: number;
  uploadBeginAt: number;
  uploadEndAt: number;
}

export const useUploadStore = defineStore('upload', () => {
  const files = ref<UploadFile[]>([]);

  return {
    files,
    forceRenew() {
      forceRenew();
    },
    renew() {
      renew();
    },
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUploadStore, import.meta.hot));
}
