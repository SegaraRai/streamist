<script lang="ts" setup>
import { useUploadStore } from '~/stores/upload';

const uploadStore = useUploadStore();

const onFileSelected = (event: Event) => {
  const fileList = (event.target as HTMLInputElement).files;
  if (!fileList) {
    return;
  }
  uploadStore.addFiles(Array.from(fileList));
};

const inputFileElement = ref<HTMLInputElement | undefined>();
</script>

<template>
  <input
    ref="inputFileElement"
    type="file"
    multiple
    class="hidden"
    @change="onFileSelected"
  />
  <div class="flex mb-4 px-4 justify-between">
    <v-btn color="primary" text @click="inputFileElement?.click()">
      <v-icon>mdi-plus</v-icon>
      <span class="ml-2">Add File</span>
    </v-btn>
    <v-btn color="red" text @click="uploadStore.clearAll()">
      <v-icon>mdi-close</v-icon>
      <span class="ml-2">Clear All</span>
    </v-btn>
  </div>
  <v-divider />
  <s-uploader-list class="h-80" />
  <v-divider />
  <div class="flex gap-x-4 mt-4 px-4 mb-4">
    <v-btn color="primary" text @click="uploadStore.startUpload()">
      <v-icon>mdi-cloud-upload</v-icon>
      <span class="ml-2">Start Upload</span>
    </v-btn>
  </div>
</template>
