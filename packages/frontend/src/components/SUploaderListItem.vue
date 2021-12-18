<script lang="ts">
import type { PropType } from 'vue';
import type { UploadFile } from '~/logic/uploadManager';
import type { ResolvedUploadFile } from '~/logic/uploadResolver';

export type FileType = ResolvedUploadFile['type'] | UploadFile['fileType'];

const typeToFileIcon: Record<FileType, string> = {
  audio: 'mdi-file-music',
  audioWithCueSheet: 'mdi-file-music',
  cueSheet: 'mdi-file-table',
  image: 'mdi-file-image',
  imageWithAttachTarget: 'mdi-file-image',
  unknown: 'mdi-file-question',
};

function humanizeSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KiB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MiB`;
  }

  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GiB`;
}

export default defineComponent({
  props: {
    file: Object as PropType<File>,
    fileType: String as PropType<FileType>,
  },
  setup() {
    return {
      humanizeSize,
      typeToFileIcon,
    };
  },
});
</script>

<template>
  <v-list-item>
    <v-list-item-avatar icon class="flex-none flex items-center justify-center">
      <v-icon>{{ typeToFileIcon[fileType || 'unknown'] }}</v-icon>
    </v-list-item-avatar>
    <v-list-item-header class="px-2">
      <div class="flex-1 flex items-center">
        <div
          class="flex-1 text-sm whitespace-nowrap overflow-hidden overflow-ellipsis"
        >
          {{ file?.name ?? '' }}
        </div>
        <div class="flex-none text-sm w-24 text-right opacity-75">
          {{ humanizeSize(file?.size ?? 0) }}
        </div>
      </div>
    </v-list-item-header>
    <v-list-item-avatar icon class="flex-none flex items-center justify-center">
      <slot></slot>
    </v-list-item-avatar>
  </v-list-item>
</template>
