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
    const selectedArtistLabel$$q = ref<string | undefined>();

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

    const options$$q = computed(() =>
      artists$$q.value.map(({ item }) => ({
        label: item.name,
        value: item.id,
      }))
    );

    return {
      t,
      options$$q,
      modelValue$$q,
      artistId$$q,
      onSelected$$q: (artistId: string | number): void => {
        // NOTE: label will not be undefined
        const label = options$$q.value.find(
          (option) => option.value === artistId
        )?.label;
        if (label != null) {
          selectedArtistLabel$$q.value = label;
        }
        artistId$$q.value = artistId as string;
      },
      onUpdated$$q: (value: string): void => {
        if (value !== selectedArtistLabel$$q.value) {
          artistId$$q.value = undefined;
          selectedArtistLabel$$q.value = undefined;
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
            <template v-if="artistId$$q">
              <SArtistImage
                class="flex-none mr-2 w-6 h-6"
                :artist="artistId$$q"
              />
            </template>
            <template v-else-if="create && modelValue$$q">
              <NPopover placement="top" trigger="hover">
                <template #trigger>
                  <i-mdi-account-plus
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
