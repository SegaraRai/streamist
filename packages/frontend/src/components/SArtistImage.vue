<script lang="ts">
import { db } from '~/db';
import { compareAlbum } from '~/logic/sort';
import { useLiveQuery } from '~/logic/useLiveQuery';

export default defineComponent({
  props: {
    artistId: {
      type: String,
      required: true,
    },
  },
  emits: {
    imageIds: (_imageIds: readonly string[] | undefined) => true,
  },
  setup(props, context) {
    const artistId = computed(() => props.artistId);
    watch(artistId, () => {
      context.emit('imageIds', undefined);
    });
    const { value: image, valueExists: fetched } = useLiveQuery(async () => {
      const id = artistId.value;
      if (!id) {
        return;
      }
      const artist = await db.artists.get(id);
      if (!artist) {
        return;
      }
      if (id !== artistId.value) {
        return;
      }
      context.emit('imageIds', artist.imageIds);
      let imageId: string | undefined;
      if (artist.imageIds[0]) {
        imageId = artist.imageIds[0];
      } else {
        const albums = await db.albums.where({ artistId: id }).toArray();
        albums.sort(compareAlbum);
        const imageIds = albums.flatMap((album) => album.imageIds);
        imageId = imageIds[0];
      }
      if (!imageId) {
        return;
      }
      const image = db.images.get(imageId);
      if (id !== artistId.value) {
        return;
      }
      return image;
    }, [artistId]);

    return {
      image,
      fetched,
    };
  },
});
</script>

<template>
  <s-nullable-image
    class="rounded-full select-none"
    :image="fetched && image"
  />
</template>
