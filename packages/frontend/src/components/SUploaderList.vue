<script lang="ts" setup>
import type { UploadFile } from '~/logic/uploadManager';
import { useUploadStore } from '~/stores/upload';

function getProgress(file: UploadFile): number | string | undefined {
  switch (file.status) {
    case 'pending':
    case 'queued':
    case 'uploaded':
    case 'transcoding':
      return -1;

    case 'uploading':
      return ((file.uploadedSize || 0) / file.fileSize) * 100;

    case 'skipped':
      return 'mdi-skip-next';

    case 'transcoded':
      return 'mdi-check-circle';

    case 'error_invalid':
    case 'error_upload_failed':
    case 'error_transcode_failed':
      return 'mdi-alert-circle';
  }
}

const uploadStore = useUploadStore();
</script>

<template>
  <v-list density="compact">
    <template v-for="(file, _index) in uploadStore.stagedFiles" :key="_index">
      <s-uploader-list-item
        :file="file.file"
        :file-type="file.type"
        progress="mdi-delete"
      />
      <template v-if="file.type === 'audioWithCueSheet'">
        <s-uploader-list-item
          class="ml-6"
          :file="file.cueSheetFile"
          file-type="cueSheet"
          progress="mdi-delete"
        />
      </template>
    </template>
    <template v-for="(file, _index) in uploadStore.files" :key="_index">
      <s-uploader-list-item
        :file="file.file"
        :file-type="file.fileType"
        :progress="getProgress(file)"
      />
    </template>
  </v-list>
</template>
