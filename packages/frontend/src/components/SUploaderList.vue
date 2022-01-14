<script lang="ts">
import { useUploadStore } from '~/stores/upload';

export default defineComponent({
  setup() {
    const uploadStore = useUploadStore();

    return {
      stagedFiles$$q: computed(() => uploadStore.stagedFiles),
      files$$q: computed(() => uploadStore.files),
      removeStagingFile$$q: uploadStore.removeStagingFile,
      removeFile$$q: uploadStore.removeFile,
    };
  },
});
</script>

<template>
  <v-list density="compact">
    <template v-for="(file, _index) in stagedFiles$$q" :key="_index">
      <s-uploader-list-item
        :filename="file.file.name"
        :filesize="file.file.size"
        :file-type="file.type"
        class="s-hover-container text-st-primary"
      >
        <v-btn
          flat
          icon
          size="small"
          class="s-hover-visible text-st-error"
          @click="removeStagingFile$$q(file.id)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
        <template v-if="file.type === 'unknown'">
          <v-icon class="s-hover-hidden text-st-error">mdi-alert-circle</v-icon>
        </template>
      </s-uploader-list-item>
      <template v-if="file.type === 'audioWithCueSheet'">
        <s-uploader-list-item
          class="ml-6 text-st-info"
          :filename="file.cueSheetFile.name"
          :filesize="file.cueSheetFile.size"
          file-type="cueSheet"
        />
      </template>
    </template>
    <template v-for="(file, _index) in files$$q" :key="_index">
      <template v-if="file.status !== 'removed'">
        <s-uploader-list-item
          :filename="file.filename"
          :filesize="file.fileSize"
          :file-type="file.fileType"
          class="s-hover-container"
        >
          <template
            v-if="
              file.status === 'validating' ||
              file.status === 'validated' ||
              file.status === 'pending' ||
              file.status === 'queued'
            "
          >
            <v-btn
              flat
              icon
              size="small"
              class="s-hover-visible text-st-error"
              @click="removeFile$$q(file.id)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
            <v-progress-circular
              class="s-hover-hidden"
              title="Waiting for upload..."
              indeterminate
              size="28"
            />
          </template>
          <template v-else-if="file.status === 'uploading'">
            <template v-if="file.file">
              <v-progress-circular
                :model-value="((file.uploadedSize || 0) * 100) / file.fileSize"
                :title="`Uploading... (${(
                  ((file.uploadedSize || 0) * 100) /
                  file.fileSize
                ).toFixed(2)}% complete)`"
                size="28"
              />
            </template>
            <template v-else>
              <v-progress-circular
                color="primary"
                title="Uploading..."
                indeterminate
                size="28"
              />
            </template>
          </template>
          <template
            v-else-if="
              file.status === 'uploaded' || file.status === 'transcoding'
            "
          >
            <v-progress-circular
              color="primary"
              title="Waiting for transcode..."
              indeterminate
              size="28"
            />
          </template>
          <template
            v-else-if="
              file.status === 'skipped' ||
              file.status === 'error_invalid' ||
              file.status === 'error_aborted' ||
              file.status === 'error_upload_failed' ||
              file.status === 'error_transcode_failed' ||
              file.status === 'transcoded'
            "
          >
            <v-btn
              flat
              icon
              size="small"
              class="s-hover-visible text-st-success"
              @click="removeFile$$q(file.id)"
            >
              <v-icon>mdi-check</v-icon>
            </v-btn>
            <template v-if="file.status === 'transcoded'">
              <v-icon
                class="s-hover-hidden text-st-success"
                title="Upload complete"
              >
                mdi-check-circle
              </v-icon>
            </template>
            <template v-else>
              <v-icon
                class="s-hover-hidden text-st-error"
                title="Upload failed"
              >
                mdi-alert-circle
              </v-icon>
            </template>
          </template>
        </s-uploader-list-item>
      </template>
    </template>
  </v-list>
</template>
