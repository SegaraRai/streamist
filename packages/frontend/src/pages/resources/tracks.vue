<script lang="ts">
import { compareString } from '$/shared/sort';
import { useAllTracks } from '~/composables';

export default defineComponent({
  setup() {
    useHead({
      title: 'Resources/Tracks | Streamist',
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
        value.value
          ?.map((item, index) => ({
            key: index,
            ...item,
          }))
          .sort((a, b) => compareString(a.id, b.id)) || []
    );

    return {
      columns$$q: columns,
      items$$q: items,
    };
  },
});
</script>

<template>
  <v-container fluid>
    <header class="mb-6 flex items-baseline gap-x-4">
      <div class="text-h5">Resources/Tracks</div>
      <template v-if="items$$q?.length">
        <div class="light:font-medium opacity-60">
          {{ items$$q.length }} item(s)
        </div>
      </template>
    </header>
    <n-data-table :columns="columns$$q" :data="items$$q" virtual-scroll />
  </v-container>
</template>
