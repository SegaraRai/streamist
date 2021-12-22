<script lang="ts">
import { db } from '~/db';
import { useLiveQuery } from '~/logic/useLiveQuery';

export default defineComponent({
  props: {
    albumId: {
      type: String,
      required: true,
    },
  },
  emits: {
    imageIds: (_imageIds: readonly string[] | undefined) => true,
  },
  setup(props, context) {
    const albumId = computed(() => props.albumId);
    watch(albumId, () => {
      context.emit('imageIds', undefined);
    });
    const { value: image, valueExists: fetched } = useLiveQuery(async () => {
      const id = albumId.value;
      if (!id) {
        return;
      }
      const album = await db.albums.get(id);
      if (!album) {
        return;
      }
      if (id !== albumId.value) {
        return;
      }
      context.emit('imageIds', album.imageIds);
      const imageId = album.imageIds[0];
      if (!imageId) {
        return;
      }
      const image = await db.images.get(imageId);
      if (id !== albumId.value) {
        return;
      }
      return image;
    }, [albumId]);

    return {
      image,
      fetched,
    };
  },
});
</script>

<template>
  <s-nullable-image class="select-none" :image="fetched && image" />
</template>
