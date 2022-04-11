<script lang="ts">
import { useAlbumSearch } from '~/composables';
import { db } from '~/db';

export default defineComponent({
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    albumId: {
      type: String,
      default: undefined,
    },
    artistName: {
      type: String,
      default: undefined,
    },
    label: {
      type: String,
      default: undefined,
    },
    create: Boolean,
  },
  emits: {
    'update:modelValue': (_modelValue: string) => true,
    'update:albumId': (_albumId: string) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const searchAlbums = useAlbumSearch();
    const modelValue$$q = useVModel(props, 'modelValue', emit);
    const albumId$$q = useVModel(props, 'albumId', emit);
    const selectedAlbumLabel$$q = ref<string | undefined>();

    const albums$$q = searchAlbums(modelValue$$q);

    watch(
      [modelValue$$q, albumId$$q],
      ([newModelValue, newAlbumId]) => {
        if (!newModelValue && newAlbumId) {
          db.albums.get(newAlbumId).then((album) => {
            if (album && album.id === newAlbumId) {
              modelValue$$q.value = album.title;
            }
          });
        }
      },
      {
        immediate: true,
      }
    );

    const options$$q = computed(
      () =>
        albums$$q.value.map(({ item }) => ({
          label: item.title,
          value: item.id,
        })) || []
    );

    return {
      t,
      options$$q,
      modelValue$$q,
      albumId$$q,
      onSelected$$q: (albumId: string | number): void => {
        // NOTE: label will not be undefined
        const label = options$$q.value.find(
          (option) => option.value === albumId
        )?.label;
        if (label != null) {
          selectedAlbumLabel$$q.value = label;
        }
        albumId$$q.value = albumId as string;
      },
      onUpdated$$q: (value: string): void => {
        if (value !== selectedAlbumLabel$$q.value) {
          albumId$$q.value = undefined;
          selectedAlbumLabel$$q.value = undefined;
        }
      },
    };
  },
});
</script>

<template>
  <div class="flex gap-x-4 items-center">
    <NAutoComplete
      v-model:value="modelValue$$q"
      class="flex-1"
      :options="options$$q"
      @select="onSelected$$q"
      @update-value="onUpdated$$q"
    >
      <template #default="{ handleInput }">
        <VTextField
          :label="label"
          hide-details
          :model-value="modelValue$$q"
          @input="e => handleInput((e.target as HTMLInputElement).value)"
        >
          <template #prependInner>
            <template v-if="albumId$$q">
              <SAlbumImage class="flex-none mr-2 w-6 h-6" :album="albumId$$q" />
            </template>
            <template v-else-if="create && modelValue$$q">
              <NPopover placement="top" trigger="hover">
                <template #trigger>
                  <i-mdi-plus-circle
                    class="flex-none mr-2 w-6 h-6 text-st-info"
                  />
                </template>
                <div>
                  {{
                    t('combobox.album.CreateNewAlbum', [
                      modelValue$$q,
                      artistName,
                    ])
                  }}
                </div>
              </NPopover>
            </template>
            <template v-else>
              <div class="mr-2 w-6 h-6"></div>
            </template>
          </template>
        </VTextField>
      </template>
    </NAutoComplete>
  </div>
</template>
