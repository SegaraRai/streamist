<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import type { SourceFileAttachToType } from '$shared/types';
import type { ResourceImage } from '$/types';
import { useLiveQuery } from '~/composables';
import { db, useSyncDB } from '~/db';
import api from '~/logic/api';
import { FILE_ACCEPT_IMAGE } from '~/logic/fileAccept';
import { getImageFileURL } from '~/logic/fileURL';
import { NAIVE_UI_THEMES, createOverrideTheme } from '~/logic/theme';
import type { FileId } from '~/logic/uploadManager';
import { waitForChange } from '~/logic/waitForChange';
import { useThemeStore } from '~/stores/theme';
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
    disableDialog: Boolean,
  },
  setup(props) {
    const { t } = useI18n();
    const message = useMessage();
    const syncDB = useSyncDB();
    const uploadStore = useUploadStore();
    const themeStore$$q = useThemeStore();

    const errorOverrideTheme$$q = eagerComputed(() =>
      createOverrideTheme(
        NAIVE_UI_THEMES[themeStore$$q.theme].overrides,
        'error'
      )
    );

    const roundClass$$q = eagerComputed(() => {
      switch (props.attachToType) {
        case 'album':
          return '';

        case 'artist':
          return 'rounded-full';

        case 'playlist':
          return 'rounded-lg';
      }
    });

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
      errorOverrideTheme$$q,
      inputFileElement$$q,
      roundClass$$q,
      dialog$$q,
      loaded$$q,
      hasImage$$q,
      images$$q,
      uploading$$q,
      accept$$q: FILE_ACCEPT_IMAGE,
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
      onImageOrderChanged$$q: async (
        image: ResourceImage,
        nextImage: ResourceImage | undefined
      ): Promise<void> => {
        try {
          await getAPIImageRoot(image.id)?.$patch({
            body: {
              nextImageId: nextImage?.id ?? null,
            },
          });

          message.success(t('message.ReorderedImage', [props.attachToTitle]));

          syncDB();

          await waitForChange(images$$q, 1000);
        } catch (error) {
          message.error(
            t('message.FailedToReorderImage', [
              props.attachToTitle,
              String(error),
            ])
          );
        }
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

        const inputElement = event.target as HTMLInputElement;
        const fileList = inputElement.files;
        if (!fileList) {
          return;
        }

        uploadingFileIds$$q.value = uploadStore.uploadImageFiles(
          Array.from(fileList),
          props.attachToType,
          props.attachToId,
          props.disableDialog
        );

        inputElement.files = new DataTransfer().files;
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
    :class="roundClass$$q"
    @click="onImageClicked$$q"
  >
    <slot></slot>
    <template v-if="loaded$$q && (!hasImage$$q || disableDialog)">
      <template v-if="uploading$$q">
        <div
          class="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white text-4xl bg-black/50"
          :class="roundClass$$q"
        >
          <v-progress-circular indeterminate />
        </div>
      </template>
      <template v-else>
        <div
          class="s-hover-visible absolute top-0 left-0 w-full h-full flex items-center justify-center text-white text-4xl bg-black/50"
          :class="roundClass$$q"
        >
          <i-mdi-image-plus class="w-16 h-16" />
        </div>
      </template>
    </template>
  </button>
  <input
    ref="inputFileElement$$q"
    type="file"
    class="hidden"
    :multiple="!disableDialog"
    :accept="accept$$q"
    @change="onFileSelected$$q"
  />
  <n-modal v-model:show="dialog$$q" transform-origin="center">
    <div
      class="pt-12 w-screen h-screen !sm:pt-0 sm:w-auto sm:h-auto sm:min-w-xl sm:max-w-180 md:min-w-180 md:max-w-220 lg:min-w-220 lg:max-w-260"
    >
      <v-card class="w-full h-full">
        <v-card-title class="flex">
          <div class="flex-1 line-clamp-2 overflow-hidden">
            <slot name="title"></slot>
          </div>
          <div class="flex-none">
            <v-btn
              flat
              icon
              size="x-small"
              class="text-st-error"
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
              <s-draggable
                :items="images$$q"
                item-key="id"
                class="flex gap-x-4 h-64 sm:h-80 pt-8"
                :on-move="onImageOrderChanged$$q"
                :disabled="images$$q.length <= 1"
                @dragstart="dragging$$q = true"
                @dragend="dragging$$q = false"
              >
                <template #item="{ element }">
                  <div class="flex-none flex flex-col gap-y-4 items-center">
                    <a
                      class="block"
                      target="_blank"
                      rel="noopener noreferrer"
                      :href="getOriginalImageURL$$q(element)"
                    >
                      <s-nullable-image
                        class="flex-none w-32 h-32 sm:w-48 sm:h-48"
                        :image="element"
                        :alt="attachToTitle"
                        size="200"
                      />
                    </a>
                    <n-config-provider :theme-overrides="errorOverrideTheme$$q">
                      <n-popconfirm
                        :positive-text="t('confirm.deleteImage.button.Delete')"
                        :negative-text="t('confirm.deleteImage.button.Cancel')"
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
                            <v-btn flat icon size="small" class="text-st-error">
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </n-button>
                        </template>
                        <div class="flex flex-col gap-y-2">
                          <div class="flex-1">
                            {{ t('confirm.deleteImage.text', [attachToTitle]) }}
                          </div>
                          <div class="font-bold text-sm text-st-error">
                            {{ t('common.ThisActionCannotBeUndone') }}
                          </div>
                        </div>
                      </n-popconfirm>
                    </n-config-provider>
                  </div>
                </template>
                <template #footer>
                  <div class="flex-none flex flex-col gap-y-4 items-center">
                    <v-btn
                      flat
                      class="!w-32 !h-32 !sm:w-48 !sm:h-48 flex items-center justify-center border"
                      @click="inputFileElement$$q?.click()"
                    >
                      <v-icon size="48">mdi-image-plus</v-icon>
                    </v-btn>
                  </div>
                </template>
              </s-draggable>
            </template>
          </n-scrollbar>
        </v-card-text>
      </v-card>
    </div>
  </n-modal>
</template>
