<script lang="ts">
import type { PropType } from 'vue';
import { humanizeSize } from '~/logic/humanizeSize';
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

export default defineComponent({
  props: {
    filename: {
      type: String,
      default: undefined,
    },
    filesize: {
      type: Number,
      default: undefined,
    },
    fileType: {
      type: String as PropType<FileType>,
      required: true,
    },
  },
  setup() {
    return {
      humanizeSize$$q: humanizeSize,
      typeToFileIcon$$q: typeToFileIcon,
    };
  },
});
</script>

<template>
  <v-list-item>
    <v-list-item-avatar icon class="flex-none flex items-center justify-center">
      <v-icon>{{ typeToFileIcon$$q[fileType || 'unknown'] }}</v-icon>
    </v-list-item-avatar>
    <v-list-item-header class="px-2">
      <div class="flex-1 flex items-center">
        <div
          class="flex-1 text-sm whitespace-nowrap overflow-hidden overflow-ellipsis"
        >
          {{ filename ?? '' }}
        </div>
        <div class="flex-none text-sm w-24 text-right opacity-60">
          {{ humanizeSize$$q(filesize ?? 0) }}
        </div>
      </div>
    </v-list-item-header>
    <v-list-item-avatar icon class="flex-none flex items-center justify-center">
      <slot></slot>
    </v-list-item-avatar>
  </v-list-item>
</template>
