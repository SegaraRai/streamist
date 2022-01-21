<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import { filterNullAndUndefined } from '$shared/filter';
import type { SourceFileAttachToType } from '$shared/types';
import type { ResourceImage } from '$/types';
import { useLiveQuery } from '~/composables';
import { useEffectiveTheme } from '~/composables/useEffectiveTheme';
import { db, useLocalStorageDB, useSyncDB } from '~/db';
import { api } from '~/logic/api';
import { FILE_ACCEPT_IMAGE } from '~/logic/fileAccept';
import { getImageFileURL } from '~/logic/fileURL';
import { NAIVE_UI_THEMES, createOverrideTheme } from '~/logic/theme';
import { waitForChange } from '~/logic/waitForChange';
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
    const { dbUserId$$q } = useLocalStorageDB();
    const { themeName$$q } = useEffectiveTheme();

    const errorOverrideTheme$$q = eagerComputed(() =>
      createOverrideTheme(
        NAIVE_UI_THEMES[themeName$$q.value].overrides,
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
      }
    };

    const getAPIImageRoot = (imageId: string) => {
      return getAPIRoot()?.images._imageId(imageId);
    };

    const uploadingFiles$$q = computed(() => {
      return uploadStore.files.filter(
        (file) =>
          (file.status === 'pending' ||
            file.status === 'validating' ||
            file.status === 'validated' ||
            file.status === 'queued' ||
            file.status === 'uploading' ||
            file.status === 'uploaded' ||
            file.status === 'transcoding') &&
          file.attachTarget?.attachToType === props.attachToType &&
          file.attachTarget?.attachToId === props.attachToId
      );
    });
    const uploadingFilesPrepend$$q = computed(() => {
      return uploadingFiles$$q.value.filter(
        (file) => file.attachTarget?.attachPrepend
      );
    });
    const uploadingFilesAppend$$q = computed(() => {
      return uploadingFiles$$q.value
        .filter((file) => !file.attachTarget?.attachPrepend)
        .reverse();
    });
    const uploading$$q = computed(() => uploadingFiles$$q.value.length > 0);

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
      return filterNullAndUndefined(
        await db.images.bulkGet([...imageIds$$q.value])
      );
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
      uploadingFilesPrepend$$q,
      uploadingFilesAppend$$q,
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
        const userId = dbUserId$$q.value;
        if (!userId) {
          return;
        }
        return getImageFileURL(userId, image.id, imageFile);
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

        uploadStore.uploadImageFiles(
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
    <div class="pt-12 max-w-full !sm:pt-0 sm:w-xl md:w-180 lg:w-220">
      <v-card class="w-full h-full">
        <v-card-title class="flex">
          <div class="s-dialog-title">
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
              <div class="py-8">
                <s-draggable
                  :items="images$$q"
                  item-key="id"
                  class="flex gap-x-4 h-48 sm:h-64"
                  :on-move="onImageOrderChanged$$q"
                  :disabled="images$$q.length <= 1"
                  @dragstart="dragging$$q = true"
                  @dragend="dragging$$q = false"
                >
                  <template #header>
                    <template
                      v-for="image in uploadingFilesPrepend$$q"
                      :key="image.id"
                    >
                      <s-uploading-image
                        class="flex-none w-32 h-32 sm:w-48 sm:h-48 overflow-hidden"
                        :file="image.file"
                      />
                    </template>
                  </template>
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
                      <n-config-provider
                        :theme-overrides="errorOverrideTheme$$q"
                      >
                        <n-popconfirm
                          :positive-text="
                            t('confirm.deleteImage.button.Delete')
                          "
                          :negative-text="
                            t('confirm.deleteImage.button.Cancel')
                          "
                          @positive-click="removeImage$$q(element.id)"
                        >
                          <template #trigger>
                            <n-button
                              tag="div"
                              text
                              class="select-none"
                              :class="dragging$$q ? 'invisible' : ''"
                              data-draggable="false"
                              @dragstart.stop.prevent
                            >
                              <v-btn
                                flat
                                icon
                                size="small"
                                class="text-st-error"
                              >
                                <v-icon>mdi-delete</v-icon>
                              </v-btn>
                            </n-button>
                          </template>
                          <div class="flex flex-col gap-y-2">
                            <div class="flex-1">
                              {{
                                t('confirm.deleteImage.text', [attachToTitle])
                              }}
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
                    <template
                      v-for="image in uploadingFilesAppend$$q"
                      :key="image.id"
                    >
                      <s-uploading-image
                        class="flex-none w-32 h-32 sm:w-48 sm:h-48 overflow-hidden"
                        :file="image.file"
                      />
                    </template>
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
              </div>
            </template>
          </n-scrollbar>
        </v-card-text>
      </v-card>
    </div>
  </n-modal>
</template>
