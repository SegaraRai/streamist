<script lang="ts">
import { useArtistSearch } from '~/composables';
import { db } from '~/db';

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
    label: {
      type: String,
      default: undefined,
    },
    create: Boolean,
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
    <NAutoComplete
      v-model:value="modelValue$$q"
      class="flex-1"
      :options="options$$q"
      @select="onSelected$$q"
      @update-value="artistId$$q = undefined"
    >
      <template #default="{ handleInput }">
        <VTextField
          class="s-v-input-hide-details"
          :label="label"
          hide-details
          :model-value="modelValue$$q"
          @input="e => handleInput((e.target as HTMLInputElement).value)"
        >
          <template #prependInner>
            <template v-if="artistId$$q">
              <SArtistImage
                class="flex-none mr-2 w-6 h-6"
                :artist="artistId$$q"
              />
            </template>
            <template v-else-if="create && modelValue$$q">
              <NPopover placement="top" trigger="hover">
                <template #trigger>
                  <IMdiAccountPlus
                    class="flex-none mr-2 w-6 h-6 text-st-info"
                  />
                </template>
                <div>
                  {{ t('combobox.artist.CreateNewArtist', [modelValue$$q]) }}
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
