<script lang="ts">
import { useArtistSearch } from '~/logic/useSearch';

export default defineComponent({
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: {
    'update:modelValue': (_modelValue: string) => true,
  },
  setup(props, context) {
    const artistSearch = useArtistSearch();
    const modelValue$$q = useVModel(props, 'modelValue', context.emit);

    const value$$q = ref('');
    const lastSelectedArtistId$$q = ref<string | undefined>();

    return {
      options$$q: computed(
        () =>
          artistSearch.value(value$$q.value).map((artist) => ({
            label: artist.name,
            value: artist.id,
          })) || []
      ),
      modelValue$$q,
      value$$q,
      lastSelectedArtistId$$q,
      onSelected$$q: (artistId: string | number): void => {
        lastSelectedArtistId$$q.value = artistId as string;
      },
      editMode$$q: ref(true),
    };
  },
});
</script>

<template>
  <div class="flex gap-x-4 items-center">
    <template v-if="lastSelectedArtistId$$q">
      <s-artist-image
        class="flex-none w-6 h-6"
        :artist="lastSelectedArtistId$$q"
      />
    </template>
    <template v-else>
      <i-mdi-account-plus class="flex-none w-6 h-6" />
    </template>
    <template v-if="editMode$$q">
      <n-auto-complete
        v-model:value="value$$q"
        class="flex-1"
        :options="options$$q"
        @select="onSelected$$q"
        @update-value="lastSelectedArtistId$$q = undefined"
      >
        <template #default="{ handleInput }">
          <input
            :value="value$$q"
            @input="e => handleInput((e.target as HTMLInputElement).value)"
          />
        </template>
      </n-auto-complete>
      <v-btn flat icon text size="x-small" @click="editMode$$q = false">
        <v-icon color="success">mdi-check</v-icon>
      </v-btn>
    </template>
    <template v-else>
      <div class="text-sm min-w-32">{{ value$$q }}</div>
      <v-btn flat icon text size="x-small" @click="editMode$$q = true">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </template>
  </div>
</template>
