<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import { filterNullAndUndefined } from '$shared/filter';
import type { SourceFileAttachToType } from '$shared/types';
import type { ResourceImage } from '$/types';
import { useEffectiveTheme, useLiveQuery } from '~/composables';
import { db, useSyncDB } from '~/db';
import { api } from '~/logic/api';
import { FILE_ACCEPT_IMAGE } from '~/logic/fileAccept';
import { getImageFileURL } from '~/logic/fileURL';
import { NAIVE_UI_THEMES, createOverrideTheme } from '~/logic/theme';
import { getUserId } from '~/logic/tokens';
import { waitForChange } from '~/logic/waitForChange';
import { useUploadStore } from '~/stores/upload';

export default defineComponent({
  inheritAttrs: false,
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
    const { themeName$$q } = useEffectiveTheme();

    const errorOverrideTheme$$q = computedEager(() =>
      createOverrideTheme(
        NAIVE_UI_THEMES[themeName$$q.value].overrides,
        'error'
      )
    );

    const roundClass$$q = computedEager(() => {
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
    const loaded$$q = computedEager(() => !!props.imageIds);
    const hasImage$$q = computedEager(() => props.imageIds?.length !== 0);
    const imageIds$$q = computedEager(() => props.imageIds);
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
        const userId = getUserId();
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
          <VProgressCircular indeterminate />
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
  <NModal v-model:show="dialog$$q" transform-origin="center">
    <div class="pt-12 max-w-full !sm:pt-0 sm:w-xl md:w-180 lg:w-220">
      <VCard class="w-full h-full">
        <VCardTitle class="flex">
          <div class="s-dialog-title">
            <slot name="title"></slot>
          </div>
          <div class="flex-none">
            <VBtn
              flat
              icon
              size="x-small"
              class="text-st-error"
              @click="dialog$$q = false"
            >
              <i-mdi-close />
            </VBtn>
          </div>
        </VCardTitle>
        <VCardText class="opacity-100 flex flex-col items-center">
          <NScrollbar class="flex-1 s-n-scrollbar-flex-col-center" x-scrollable>
            <template v-if="images$$q">
              <div class="py-8">
                <SDraggable
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
                      <SUploadingImage
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
                        rel="noopener"
                        :href="getOriginalImageURL$$q(element)"
                      >
                        <SNullableImage
                          class="flex-none w-32 h-32 sm:w-48 sm:h-48"
                          size="200"
                          :image="element"
                          :alt="attachToTitle"
                        />
                      </a>
                      <NConfigProvider :theme-overrides="errorOverrideTheme$$q">
                        <NPopconfirm
                          :positive-text="
                            t('confirm.deleteImage.button.Delete')
                          "
                          :negative-text="
                            t('confirm.deleteImage.button.Cancel')
                          "
                          @positive-click="removeImage$$q(element.id)"
                        >
                          <template #trigger>
                            <NButton
                              tag="div"
                              text
                              class="select-none"
                              :class="dragging$$q ? 'invisible' : ''"
                              data-draggable="false"
                              @dragstart.stop.prevent
                            >
                              <VBtn
                                flat
                                icon
                                size="small"
                                class="text-st-error"
                              >
                                <i-mdi-delete />
                              </VBtn>
                            </NButton>
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
                        </NPopconfirm>
                      </NConfigProvider>
                    </div>
                  </template>
                  <template #footer>
                    <template
                      v-for="image in uploadingFilesAppend$$q"
                      :key="image.id"
                    >
                      <SUploadingImage
                        class="flex-none w-32 h-32 sm:w-48 sm:h-48 overflow-hidden"
                        :file="image.file"
                      />
                    </template>
                    <div class="flex-none flex flex-col gap-y-4 items-center">
                      <VBtn
                        flat
                        class="!w-32 !h-32 !sm:w-48 !sm:h-48 flex items-center justify-center border"
                        @click="inputFileElement$$q?.click()"
                      >
                        <i-mdi-image-plus class="text-3rem" />
                      </VBtn>
                    </div>
                  </template>
                </SDraggable>
              </div>
            </template>
          </NScrollbar>
        </VCardText>
      </VCard>
    </div>
  </NModal>
</template>
