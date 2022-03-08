<script lang="ts">
import type { UploadFile } from '~/logic/uploadManager';
import type { ResolvedUploadFile } from '~/logic/uploadResolver';
import { useUploadStore } from '~/stores/upload';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const uploadStore = useUploadStore();

    return {
      t,
      uploadStore$$q: uploadStore,
      getStagedFileTooltipText$$q: (file: ResolvedUploadFile): string => {
        switch (file.type) {
          case 'audio':
            return t('uploader.tooltip.stagedFile.AudioFile');

          case 'audioWithCueSheet':
            return t('uploader.tooltip.stagedFile.AudioFileWithCueSheet');

          case 'image':
            return t('uploader.tooltip.stagedFile.ImageFile');

          case 'unknown':
            return t('uploader.tooltip.stagedFile.UnknownFile');
        }
        return t('uploader.tooltip.stagedFile.UnknownFile');
      },
      getFileTooltipText$$q: (file: UploadFile): string => {
        switch (file.status) {
          case 'removed':
            return '';

          case 'error_invalid':
            return t('uploader.tooltip.file.ErrorInvalid');

          case 'error_transcode_failed':
            return t('uploader.tooltip.file.ErrorTranscodeFailed');

          case 'error_upload_aborted':
            return t('uploader.tooltip.file.ErrorAborted');

          case 'error_upload_failed':
            return t('uploader.tooltip.file.ErrorUploadFailed');

          case 'pending':
            return t('uploader.tooltip.file.Pending');

          case 'queued':
            return t('uploader.tooltip.file.Queued');

          case 'skipped':
            return t('uploader.tooltip.file.Skipped');

          case 'transcoded':
            return t('uploader.tooltip.file.Transcoded');

          case 'transcoding':
            return t('uploader.tooltip.file.Transcoding');

          case 'uploaded':
            return t('uploader.tooltip.file.Uploaded');

          case 'uploading':
            return file.file
              ? t('uploader.tooltip.file.n_Uploading', [
                  (((file.uploadedSize || 0) * 100) / file.fileSize).toFixed(2),
                ])
              : t('uploader.tooltip.file.Uploading');

          case 'validated':
            return t('uploader.tooltip.file.Validated');

          case 'validating':
            return t('uploader.tooltip.file.Validated');
        }
        return '';
      },
    };
  },
});
</script>

<template>
  <VList density="compact">
    <template
      v-for="(file, _index) in uploadStore$$q.stagedFiles"
      :key="_index"
    >
      <SUploaderListItem
        :_="(_index || undefined) && undefined"
        :filename="file.file.name"
        :filesize="file.file.size"
        :file-type="file.type"
        class="s-hover-container text-st-primary"
      >
        <div class="w-10 flex items-center justify-center">
          <NPopover placement="right" trigger="hover">
            <template #trigger>
              <div>
                <VBtn
                  flat
                  icon
                  size="small"
                  class="s-hover-visible text-st-error"
                  @click="uploadStore$$q.removeStagingFile(file.id)"
                >
                  <VIcon>mdi-delete</VIcon>
                </VBtn>
                <template v-if="file.type === 'unknown'">
                  <VIcon class="s-hover-hidden text-st-error"
                    >mdi-alert-circle</VIcon
                  >
                </template>
              </div>
            </template>
            <div>{{ getStagedFileTooltipText$$q(file) }}</div>
          </NPopover>
        </div>
      </SUploaderListItem>
      <template v-if="file.type === 'audioWithCueSheet'">
        <SUploaderListItem
          class="ml-6 text-st-primary"
          :filename="file.cueSheetFile.name"
          :filesize="file.cueSheetFile.size"
          file-type="cueSheet"
        >
          <div class="w-10"></div>
        </SUploaderListItem>
      </template>
    </template>
    <template v-for="(file, _index) in uploadStore$$q.files" :key="_index">
      <template v-if="file.status !== 'removed'">
        <SUploaderListItem
          :_="(_index || undefined) && undefined"
          :filename="file.filename"
          :filesize="file.fileSize"
          :file-type="file.fileType"
          class="s-hover-container"
        >
          <div class="w-10 flex items-center justify-center">
            <NPopover placement="right" trigger="hover">
              <template #trigger>
                <div>
                  <template
                    v-if="
                      file.status === 'validating' ||
                      file.status === 'validated' ||
                      file.status === 'pending' ||
                      file.status === 'queued'
                    "
                  >
                    <VBtn
                      flat
                      icon
                      size="small"
                      class="s-hover-visible text-st-error"
                      @click="uploadStore$$q.removeFile(file.id)"
                    >
                      <VIcon>mdi-delete</VIcon>
                    </VBtn>
                    <VProgressCircular
                      class="s-hover-hidden"
                      indeterminate
                      size="28"
                    />
                  </template>
                  <template v-else-if="file.status === 'uploading'">
                    <template v-if="file.file">
                      <VProgressCircular
                        :model-value="
                          ((file.uploadedSize || 0) * 100) / file.fileSize
                        "
                        size="28"
                        class="s-hover-hidden"
                      />
                      <NPopconfirm
                        :positive-text="t('confirm.abortUpload.button.Abort')"
                        :negative-text="t('confirm.abortUpload.button.Cancel')"
                        @positive-click="uploadStore$$q.abortFile(file.id)"
                      >
                        <template #trigger>
                          <NButton
                            tag="div"
                            text
                            class="s-hover-visible select-none"
                            data-draggable="false"
                            @dragstart.stop.prevent
                          >
                            <VBtn flat icon size="small" class="text-st-error">
                              <VIcon>mdi-cancel</VIcon>
                            </VBtn>
                          </NButton>
                        </template>
                        <div class="flex flex-col gap-y-2">
                          <div class="flex-1">
                            {{ t('confirm.abortUpload.text') }}
                          </div>
                        </div>
                      </NPopconfirm>
                    </template>
                    <template v-else>
                      <VProgressCircular
                        color="primary"
                        indeterminate
                        size="28"
                      />
                    </template>
                  </template>
                  <template
                    v-else-if="
                      file.status === 'uploaded' ||
                      file.status === 'transcoding'
                    "
                  >
                    <VProgressCircular
                      color="primary"
                      indeterminate
                      size="28"
                    />
                  </template>
                  <template
                    v-else-if="
                      file.status === 'skipped' ||
                      file.status === 'error_invalid' ||
                      file.status === 'error_upload_aborted' ||
                      file.status === 'error_upload_failed' ||
                      file.status === 'error_transcode_failed' ||
                      file.status === 'transcoded'
                    "
                  >
                    <VBtn
                      flat
                      icon
                      size="small"
                      class="s-hover-visible text-st-success"
                      @click="uploadStore$$q.removeFile(file.id)"
                    >
                      <VIcon>mdi-check</VIcon>
                    </VBtn>
                    <template v-if="file.status === 'transcoded'">
                      <VIcon class="s-hover-hidden text-st-success">
                        mdi-check-circle
                      </VIcon>
                    </template>
                    <template v-else>
                      <VIcon class="s-hover-hidden text-st-error">
                        mdi-alert-circle
                      </VIcon>
                    </template>
                  </template>
                </div>
              </template>
              <div>{{ getFileTooltipText$$q(file) }}</div>
            </NPopover>
          </div>
        </SUploaderListItem>
      </template>
    </template>
  </VList>
</template>
