<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import type { SourceFileAttachToType } from '$shared/types/db';
import type { ResourceImage } from '$/types';
import { db } from '~/db';
import { useSyncDB } from '~/db/sync';
import api from '~/logic/api';
import { VueDraggableChangeEvent } from '~/logic/draggable/types';
import { getImageFileURL } from '~/logic/fileURL';
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
    attachToTitle: {
      type: String,
      default: '',
    },
    imageIds: {
      type: Array as PropType<readonly string[] | undefined>,
      default: undefined,
    },
    rounded: Boolean,
    disableDialog: Boolean,
  },
  setup(props) {
    const { t } = useI18n();
    const message = useMessage();
    const syncDB = useSyncDB();
    const uploadStore = useUploadStore();

    const getAPIRoot = () => {
      switch (props.attachToType) {
        case 'album':
          return api.my.albums._albumId(props.attachToId);

        case 'artist':
          return api.my.artists._artistId(props.attachToId);

        case 'playlist':
          return api.my.playlists._playlistId(props.attachToId);

        default:
      }
    };

    const getAPIImageRoot = (imageId: string) => {
      return getAPIRoot()?.images._imageId(imageId);
    };

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
    const loaded$$q = eagerComputed(() => !!props.imageIds);
    const hasImage$$q = eagerComputed(() => props.imageIds?.length !== 0);
    const imageIds$$q = eagerComputed(() => props.imageIds);
    const { value: images$$q } = useLiveQuery(async () => {
      if (!imageIds$$q.value) {
        return;
      }
      if (imageIds$$q.value.length === 0) {
        return [];
      }
      return await db.images.bulkGet([...imageIds$$q.value]);
    }, [imageIds$$q]);

    watchEffect(() => {
      if (props.disableDialog || !imageIds$$q.value?.length) {
        dialog$$q.value = false;
      }
    });

    return {
      t,
      inputFileElement$$q,
      dialog$$q,
      loaded$$q,
      hasImage$$q,
      images$$q,
      uploading$$q,
      dragging$$q: ref(false),
      getOriginalImageURL$$q: (
        image: ResourceImage | undefined
      ): string | undefined => {
        if (!image) {
          return;
        }
        const imageFile = [...image.files]
          .sort((a, b) => b.width - a.width)
          .shift();
        if (!imageFile) {
          return;
        }
        return getImageFileURL(imageFile);
      },
      removeImage$$q: (imageId: string) => {
        getAPIImageRoot(imageId)
          ?.$delete()
          .then(() => {
            message.success(t('message.DeletedImage', [props.attachToTitle]));
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToDeleteImage', [
                props.attachToTitle,
                String(error),
              ])
            );
          });
      },
      onImageOrderChanged$$q: (
        event: VueDraggableChangeEvent<ResourceImage>
      ): void => {
        const { moved } = event;
        if (!moved) {
          return;
        }

        const { newIndex, oldIndex, element } = moved;
        if (newIndex === oldIndex) {
          return;
        }

        const images = images$$q.value;
        if (!images) {
          return;
        }

        const referenceImageIndex = newIndex + (newIndex > oldIndex ? 1 : 0);
        const referenceImageId = images[referenceImageIndex]?.id;

        getAPIImageRoot(element.id)
          ?.$patch({
            body: {
              nextImageId: referenceImageId ?? null,
            },
          })
          .then(() => {
            message.success(t('message.ReorderedImage', [props.attachToTitle]));
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToReorderImage', [
                props.attachToTitle,
                String(error),
              ])
            );
          });
      },
      onImageClicked$$q: (): void => {
        if (!loaded$$q.value) {
          return;
        }

        if (hasImage$$q.value && !props.disableDialog) {
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
          props.attachToId,
          props.disableDialog
        );
      },
    };
  },
});
</script>

<template>
  <button
    v-ripple
    v-bind="$attrs"
    class="active:outline-none s-hover-container relative"
    :class="rounded && 'rounded-full'"
    @click="onImageClicked$$q"
  >
    <slot></slot>
    <template v-if="loaded$$q && (!hasImage$$q || disableDialog)">
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
  <n-modal v-model:show="dialog$$q" transform-origin="center">
    <div
      class="pt-12 w-screen h-screen !sm:pt-0 sm:w-auto sm:h-auto sm:min-w-xl sm:max-w-180 md:min-w-180 md:max-w-220 lg:min-w-220 lg:max-w-260"
    >
      <v-card class="w-full h-full">
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
        <v-card-text class="opacity-100 flex flex-col items-center">
          <n-scrollbar
            class="flex-1 s-n-scrollbar-flex-col-center"
            x-scrollable
          >
            <template v-if="images$$q">
              <g-draggable
                :model-value="images$$q"
                item-key="id"
                class="flex gap-x-4 h-64 sm:h-80 pt-8"
                @change="onImageOrderChanged$$q"
              >
                <template #item="{ element }">
                  <div
                    class="flex-none flex flex-col gap-y-4 items-center"
                    @dragstart="dragging$$q = true"
                    @dragend="dragging$$q = false"
                  >
                    <a
                      class="block"
                      target="_blank"
                      rel="noopener noreferrer"
                      :href="getOriginalImageURL$$q(element)"
                    >
                      <s-nullable-image
                        class="flex-none w-32 h-32 sm:w-48 sm:h-48"
                        :image="element"
                        size="200"
                      />
                    </a>
                    <n-popconfirm
                      :positive-text="t('confirm.deleteImage.buttonDelete')"
                      :negative-text="t('confirm.deleteImage.buttonCancel')"
                      @positive-click="removeImage$$q(element.id)"
                    >
                      <template #trigger>
                        <n-button
                          tag="div"
                          text
                          class="select-none"
                          :class="dragging$$q ? 'invisible' : ''"
                          @dragstart.stop.prevent
                        >
                          <v-btn flat icon size="small" class="text-red-500">
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </n-button>
                      </template>
                      {{ t('confirm.deleteImage.text', [attachToTitle]) }}
                    </n-popconfirm>
                  </div>
                </template>
                <template #footer>
                  <div class="flex-none flex flex-col gap-y-4 items-center">
                    <v-btn
                      flat
                      class="!w-32 !h-32 !sm:w-48 !sm:h-48 flex items-center justify-center border"
                      @click="inputFileElement$$q?.click()"
                    >
                      <v-icon size="48">mdi-plus</v-icon>
                    </v-btn>
                  </div>
                </template>
              </g-draggable>
            </template>
          </n-scrollbar>
        </v-card-text>
      </v-card>
    </div>
  </n-modal>
</template>
