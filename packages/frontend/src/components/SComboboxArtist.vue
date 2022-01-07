<script lang="ts">
import { db } from '~/db';
import { useArtistSearch } from '~/logic/useSearch';

export default defineComponent({
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    artistId: {
      type: String,
      default: undefined,
    },
  },
  emits: {
    'update:modelValue': (_modelValue: string) => true,
    'update:artistId': (_artistId: string) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const searchArtists = useArtistSearch();
    const modelValue$$q = useVModel(props, 'modelValue', emit);
    const artistId$$q = useVModel(props, 'artistId', emit);

    const artists$$q = searchArtists(modelValue$$q);

    watch(
      [modelValue$$q, artistId$$q],
      ([newModelValue, newArtistId]) => {
        if (!newModelValue && newArtistId) {
          db.artists.get(newArtistId).then((artist) => {
            if (artist && artist.id === newArtistId) {
              modelValue$$q.value = artist.name;
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
          artists$$q.value.map(({ item }) => ({
            label: item.name,
            value: item.id,
          })) || []
      ),
      modelValue$$q,
      artistId$$q,
      onSelected$$q: (artistId: string | number): void => {
        artistId$$q.value = artistId as string;
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
      @update-value="artistId$$q = undefined"
    >
      <template #default="{ handleInput }">
        <v-text-field
          class="s-v-input-hide-details"
          label="Artist"
          hide-details
          :model-value="modelValue$$q"
          @input="e => handleInput((e.target as HTMLInputElement).value)"
        >
          <template #prependInner>
            <template v-if="artistId$$q">
              <s-artist-image
                class="flex-none mr-2 w-6 h-6"
                :artist="artistId$$q"
              />
            </template>
            <template v-else-if="modelValue$$q">
              <n-popover placement="top" trigger="hover">
                <template #trigger>
                  <i-mdi-account-plus
                    class="flex-none mr-2 w-6 h-6 text-blue-500"
                  />
                </template>
                <div>
                  {{ t('combobox.artist.CreateNewArtist', [modelValue$$q]) }}
                </div>
              </n-popover>
            </template>
          </template>
        </v-text-field>
      </template>
    </n-auto-complete>
  </div>
</template>
