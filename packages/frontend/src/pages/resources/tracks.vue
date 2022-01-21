<route lang="yaml">
meta:
  layout: app
</route>

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
  <VContainer fluid>
    <header class="s-title">
      <div class="text-h5">Resources/Tracks</div>
      <template v-if="items$$q?.length">
        <div class="s-subheading-sl">{{ items$$q.length }} item(s)</div>
      </template>
    </header>
    <NDataTable :columns="columns$$q" :data="items$$q" virtual-scroll />
  </VContainer>
</template>
