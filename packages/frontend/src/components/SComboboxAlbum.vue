<script lang="ts">
import { db } from '~/db';
import { useAlbumSearch } from '~/logic/useSearch';

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

    return {
      t,
      options$$q: computed(
        () =>
          albums$$q.value.map(({ item }) => ({
            label: item.title,
            value: item.id,
          })) || []
      ),
      modelValue$$q,
      albumId$$q,
      onSelected$$q: (albumId: string | number): void => {
        albumId$$q.value = albumId as string;
      },
    };
  },
});
</script>

<template>
  <div class="flex gap-x-4 items-center">
    <n-auto-complete
      v-model:value="modelValue$$q"
      class="flex-1"
      :options="options$$q"
      @select="onSelected$$q"
      @update-value="albumId$$q = undefined"
    >
      <template #default="{ handleInput }">
        <v-text-field
          class="s-v-input-hide-details"
          :label="label"
          hide-details
          :model-value="modelValue$$q"
          @input="e => handleInput((e.target as HTMLInputElement).value)"
        >
          <template #prependInner>
            <template v-if="albumId$$q">
              <s-album-image
                class="flex-none mr-2 w-6 h-6"
                :album="albumId$$q"
              />
            </template>
            <template v-else-if="modelValue$$q">
              <n-popover placement="top" trigger="hover">
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
              </n-popover>
            </template>
          </template>
        </v-text-field>
      </template>
    </n-auto-complete>
  </div>
</template>
