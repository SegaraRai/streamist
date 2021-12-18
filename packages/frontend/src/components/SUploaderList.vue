<script lang="ts" setup>
import { useUploadStore } from '~/stores/upload';

const uploadStore = useUploadStore();
</script>

<template>
  <v-list density="compact">
    <template v-for="(file, _index) in uploadStore.stagedFiles" :key="_index">
      <s-uploader-list-item
        :file="file.file"
        :file-type="file.type"
        class="s-hover-container text-blue-500"
      >
        <v-btn
          flat
          icon
          size="small"
          class="s-hover-visible text-red-500"
          @click="uploadStore.removeStagingFile(file.id)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
        <template v-if="file.type === 'unknown'">
          <v-icon class="s-hover-hidden text-red-500">mdi-alert-circle</v-icon>
        </template>
      </s-uploader-list-item>
      <template v-if="file.type === 'audioWithCueSheet'">
        <s-uploader-list-item
          class="ml-6 text-blue-500"
          :file="file.cueSheetFile"
          file-type="cueSheet"
        />
      </template>
    </template>
    <template v-for="(file, _index) in uploadStore.files" :key="_index">
      <template v-if="file.status !== 'removed'">
        <s-uploader-list-item
          :file="file.file"
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
              class="s-hover-visible text-red-500"
              @click="uploadStore.removeFile(file.id)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
            <v-progress-circular
              class="s-hover-hidden"
              title="Waiting for upload..."
              indeterminate
            />
          </template>
          <template v-else-if="file.status === 'uploading'">
            <v-progress-circular
              :model-value="((file.uploadedSize || 0) * 100) / file.fileSize"
              :title="`Uploading... (${(
                ((file.uploadedSize || 0) * 100) /
                file.fileSize
              ).toFixed(2)}% complete)`"
            />
          </template>
          <template
            v-else-if="
              file.status === 'uploaded' || file.status === 'transcoding'
            "
          >
            <v-progress-circular
              title="Waiting for transcode..."
              indeterminate
            />
          </template>
          <template
            v-else-if="
              file.status === 'skipped' ||
              file.status === 'error_invalid' ||
              file.status === 'error_upload_failed' ||
              file.status === 'error_transcode_failed' ||
              file.status === 'transcoded'
            "
          >
            <v-btn
              flat
              icon
              size="small"
              class="s-hover-visible text-green-500"
              @click="uploadStore.removeFile(file.id)"
            >
              <v-icon>mdi-check</v-icon>
            </v-btn>
            <template v-if="file.status === 'transcoded'">
              <v-icon
                class="s-hover-hidden text-green-500"
                title="Upload complete"
              >
                mdi-check-circle
              </v-icon>
            </template>
            <template v-else>
              <v-icon class="s-hover-hidden text-red-500" title="Upload failed">
                mdi-alert-circle
              </v-icon>
            </template>
          </template>
        </s-uploader-list-item>
      </template>
    </template>
  </v-list>
</template>
