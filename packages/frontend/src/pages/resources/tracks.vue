<script lang="ts">
import { useAllTracks } from '~/logic/useDB';

export default defineComponent({
  setup() {
    const { t } = useI18n();

    useHead({
      title: t('title.Resources.Tracks'),
    });

    const { value } = useAllTracks();

    const columns = [
      {
        title: 'ID',
        key: 'id',
      },
      {
        title: 'Title',
        key: 'title',
      },
      {
        title: 'Artist ID',
        key: 'artistId',
      },
      {
        title: 'Album ID',
        key: 'albumId',
      },
      {
        title: 'Duration',
        key: 'duration',
      },
      {
        title: 'Created At',
        key: 'createdAt',
      },
      {
        title: 'Updated At',
        key: 'updatedAt',
      },
    ];

    const items = computed(
      () =>
        value.value?.map((item, index) => ({
          key: index,
          ...item,
        })) || []
    );

    return {
      t,
      columns$$q: columns,
      items$$q: items,
    };
  },
});
</script>

<template>
  <v-container fluid>
    <header class="mb-6 flex items-baseline gap-x-4">
      <div class="text-h5">
        {{ t('resources.Tracks') }}
      </div>
      <template v-if="items$$q?.length">
        <div class="opacity-60">
          {{ t('tracks.n_items', items$$q.length) }}
        </div>
      </template>
    </header>
    <n-data-table :columns="columns$$q" :data="items$$q" virtual-scroll />
  </v-container>
</template>
