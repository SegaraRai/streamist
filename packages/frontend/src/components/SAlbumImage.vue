<script lang="ts">
import type { PropType } from 'vue';
import type { ResourceAlbum } from '$/types';
import { db } from '~/db';
import { useLiveQuery } from '~/logic/useLiveQuery';

export default defineComponent({
  props: {
    album: {
      type: [String, Object] as PropType<string | ResourceAlbum>,
      required: true,
    },
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
      return { album$$q: album, image$$q: image };
    }, [propAlbumRef]);

    return {
      value$$q: value,
      fetched$$q: fetched,
    };
  },
});
</script>

<template>
  <s-album-image-x
    :image="fetched$$q && value$$q?.image$$q"
    :alt="value$$q?.album$$q.title"
  />
</template>
