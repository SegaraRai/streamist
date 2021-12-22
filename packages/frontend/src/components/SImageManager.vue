<script lang="ts">
import type { PropType } from 'vue';
import type { SourceFileAttachToType } from '$shared/types/db';
import { db } from '~/db';
import type { FileId } from '~/logic/uploadManager';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { useUploadStore } from '~/stores/upload';

export default defineComponent({
  props: {
    attachToType: {
      type: String as PropType<SourceFileAttachToType>,
      required: true,
    },
    attachToId: {
      type: String,
      required: true,
    },
    imageIds: {
      type: Array as PropType<readonly string[] | undefined>,
      default: undefined,
    },
    rounded: Boolean,
  },
  setup(props) {
    const uploadStore = useUploadStore();

    const uploadingFileIds$$q = ref<readonly FileId[]>([]);
    const uploadingFiles$$q = computed(() => {
      const map = new Map(uploadStore.files.map((file) => [file.id, file]));
      return uploadingFileIds$$q.value.map((id) => map.get(id)!);
    });
    const uploading$$q = computed(() =>
      uploadingFiles$$q.value.some(
        (file) =>
          file.status === 'pending' ||
          file.status === 'validating' ||
          file.status === 'validated' ||
          file.status === 'queued' ||
          file.status === 'uploading' ||
          file.status === 'uploaded' ||
          file.status === 'transcoding'
      )
    );

    const inputFileElement$$q = ref<HTMLInputElement | null>(null);
    const dialog$$q = ref(false);
    const loaded$$q = computed(() => !!props.imageIds);
    const hasImage$$q = computed(() => props.imageIds?.length !== 0);
    const imageIds$$q = computed(() => props.imageIds);
    const { value: images$$q } = useLiveQuery(async () => {
      if (!imageIds$$q.value) {
        return;
      }
      return await db.images.bulkGet([...imageIds$$q.value]);
    }, [imageIds$$q]);

    watch(imageIds$$q, (newImageIds) => {
      if (!newImageIds || newImageIds.length === 0) {
        dialog$$q.value = false;
      }
    });

    return {
      inputFileElement$$q,
      dialog$$q,
      loaded$$q,
      hasImage$$q,
      images$$q,
      uploading$$q,
      removeImage$$q: (imageId: string) => {
        // TODO: show dialog
      },
      onImageClicked$$q: (): void => {
        if (!loaded$$q.value) {
          return;
        }

        if (hasImage$$q.value) {
          dialog$$q.value = true;
        } else {
          inputFileElement$$q.value?.click();
        }
      },
      onFileSelected$$q: (event: Event): void => {
        if (!loaded$$q.value) {
          return;
        }

        const fileList = (event.target as HTMLInputElement).files;
        if (!fileList) {
          return;
        }

        uploadingFileIds$$q.value = uploadStore.uploadImageFiles(
          Array.from(fileList),
          props.attachToType,
          props.attachToId
        );
      },
    };
  },
});
</script>

<template>
  <button
    v-ripple
    class="active:outline-none s-hover-container relative"
    :class="rounded && 'rounded-full'"
    @click="onImageClicked$$q"
  >
    <slot></slot>
    <template v-if="loaded$$q && !hasImage$$q">
      <template v-if="uploading$$q">
        <div
          class="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white text-4xl bg-black/50"
          :class="rounded && 'rounded-full'"
        >
          <v-progress-circular indeterminate />
        </div>
      </template>
      <template v-else>
        <div
          class="s-hover-visible absolute top-0 left-0 w-full h-full flex items-center justify-center text-white text-4xl bg-black/50"
          :class="rounded && 'rounded-full'"
        >
          <i-mdi-cloud-upload class="w-16 h-16" />
        </div>
      </template>
    </template>
  </button>
  <input
    ref="inputFileElement$$q"
    type="file"
    multiple
    class="hidden"
    filter="image/*"
    @change="onFileSelected$$q"
  />
  <v-dialog class="s-image-manager-dialog" :model-value="dialog$$q">
    <v-card class="w-full">
      <v-card-title class="flex">
        <div class="flex-1">
          <slot name="title"></slot>
        </div>
        <div class="flex-none">
          <v-btn
            flat
            icon
            size="x-small"
            class="text-red-500"
            @click="dialog$$q = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>
      <v-card-text class="opacity-100 flex flex-col overflow-auto items-center">
        <template v-if="images$$q">
          <div class="flex gap-x-4 h-80 pt-8">
            <template v-for="(imageId, index) in imageIds" :key="index">
              <div class="flex-none flex flex-col gap-y-4 items-center">
                <s-nullable-image
                  class="flex-none w-48 h-48"
                  :image="images$$q?.[index]"
                  size="200"
                />
                <div>
                  <v-btn
                    flat
                    icon
                    size="small"
                    class="text-red-500"
                    @click="removeImage$$q(imageId)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
              </div>
            </template>
            <div class="flex-none flex flex-col gap-y-4 items-center">
              <v-btn
                flat
                class="!w-48 !h-48 flex items-center justify-center border"
                @click="inputFileElement$$q?.click()"
              >
                <v-icon size="48">mdi-plus</v-icon>
              </v-btn>
            </div>
          </div>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style>
.v-dialog.s-image-manager-dialog:not(.v-dialog--fullscreen)
  .v-overlay__content {
  @apply max-w-full;
  @apply max-h-full;
  @apply w-2xl;
  @apply px-8;
}
</style>
