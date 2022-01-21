<script lang="ts">
import type { PropType } from 'vue';
import type { ResourceAlbum } from '$/types';
import { useLiveQuery } from '~/composables';
import { db } from '~/db';

export default defineComponent({
  props: {
    album: {
      type: [String, Object] as PropType<string | ResourceAlbum>,
      required: true,
    },
    expandable: Boolean,
  },
  emits: {
    imageIds: (_imageIds: readonly string[] | undefined) => true,
  },
  setup(props, { emit }) {
    const propAlbumRef = computed(() => props.album);
    watch(propAlbumRef, () => {
      emit('imageIds', undefined);
    });
    const { value, valueExists: fetched } = useLiveQuery(async () => {
      const propAlbum = propAlbumRef.value;
      if (!propAlbum) {
        return;
      }
      const album =
        typeof propAlbum === 'string'
          ? await db.albums.get(propAlbum)
          : propAlbum;
      if (!album) {
        return;
      }
      if (propAlbum !== propAlbumRef.value) {
        return;
      }
      emit('imageIds', album.imageIds);
      const imageId = album.imageIds[0];
      if (!imageId) {
        return;
      }
      const image = await db.images.get(imageId);
      return { album$$q: album, image$$q: image, imageIds$$q: album.imageIds };
    }, [propAlbumRef]);

    const expanded$$q = ref(false);

    return {
      value$$q: value,
      fetched$$q: fetched,
      expanded$$q,
    };
  },
});
</script>

<template>
  <SExpandable
    v-model="expanded$$q"
    :alt-base="value$$q?.album$$q.title"
    :image-ids="value$$q?.imageIds$$q"
    :disabled="!expandable"
  >
    <SAlbumImageX
      class="w-full h-full"
      :image="fetched$$q && value$$q?.image$$q"
      :alt="value$$q?.album$$q.title"
    />
  </SExpandable>
</template>
