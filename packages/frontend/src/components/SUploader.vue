<script lang="ts">
import { useLocalStorageDB } from '~/db';
import { FILE_ACCEPT_AUDIO, FILE_ACCEPT_IMAGE } from '~/logic/fileAccept';
import { useUploadStore } from '~/stores/upload';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const uploadStore = useUploadStore();
    const { dbMaxTrackId$$q } = useLocalStorageDB();

    const onFileSelected = (event: Event) => {
      const inputElement = event.target as HTMLInputElement;
      const fileList = inputElement.files;
      if (!fileList) {
        return;
      }
      uploadStore.stageFiles(Array.from(fileList));

      inputElement.files = new DataTransfer().files;
    };

    const inputFileElement = ref<HTMLInputElement | undefined>();

    const canUpload$$q = eagerComputed(() => !dbMaxTrackId$$q.value);

    return {
      t,
      inputFileElement$$q: inputFileElement,
      uploadStore$$q: uploadStore,
      canUpload$$q,
      accept$$q: `${FILE_ACCEPT_AUDIO},${FILE_ACCEPT_IMAGE}`,
      onFileSelected$$q: onFileSelected,
    };
  },
});
</script>

<template>
  <div class="flex flex-col">
    <template v-if="canUpload$$q">
      <input
        ref="inputFileElement$$q"
        type="file"
        multiple
        class="hidden"
        :accept="accept$$q"
        :disabled="!canUpload$$q"
        @change="onFileSelected$$q"
      />
      <div class="flex mb-4 px-4 justify-between">
        <VBtn
          color="primary"
          text
          :disabled="!canUpload$$q"
          @click="inputFileElement$$q?.click()"
        >
          <VIcon>mdi-plus</VIcon>
          <span class="ml-2">Add File</span>
        </VBtn>
        <VBtn
          color="red"
          text
          :disabled="!uploadStore$$q.canClearAll"
          @click="uploadStore$$q.clearAll()"
        >
          <VIcon>mdi-close</VIcon>
          <span class="ml-2">Clear All</span>
        </VBtn>
      </div>
      <VDivider />
      <NScrollbar class="max-h-screen">
        <SUploaderList />
      </NScrollbar>
      <VDivider />
      <div class="flex gap-x-4 mt-4 px-4 mb-4">
        <VBtn
          color="primary"
          text
          :disabled="!canUpload$$q || uploadStore$$q.stagedFiles.length === 0"
          @click="uploadStore$$q.startUpload()"
        >
          <VIcon>mdi-cloud-upload</VIcon>
          <span class="ml-2">Start Upload</span>
        </VBtn>
      </div>
    </template>
    <template v-else>
      <VAlert type="error" class="select-text whitespace-pre-line">
        {{ t('uploader.limitReached') }}
      </VAlert>
    </template>
  </div>
</template>
