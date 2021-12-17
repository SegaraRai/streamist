<script lang="ts" setup>
import { useUploadStore } from '~/stores/upload';

const uploadStore = useUploadStore();

const files = ref<File[]>([]);

watch(files, (newFiles) => {
  if (newFiles.length === 0) {
    return;
  }

  uploadStore.addFiles(newFiles);
  files.value = [];
});
</script>

<template>
  <div>
    <h3>Add file</h3>
    <v-file-input v-model="files" multiple />
  </div>
  <div>
    <h3>Files</h3>
    <s-uploader-list />
  </div>
  <div>
    <v-btn color="primary" text @click="uploadStore.startUpload">Upload</v-btn>
  </div>
</template>
