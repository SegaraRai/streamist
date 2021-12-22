<script lang="ts">
import { db } from '~/db';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { ResourceImage } from '$/types';

export default defineComponent({
  props: {
    playlistId: {
      type: String,
      required: true,
    },
  },
  emits: {
    imageIds: (_imageIds: readonly string[] | undefined) => true,
  },
  setup(props, context) {
    const playlistId = computed(() => props.playlistId);
    watch(playlistId, () => {
      context.emit('imageIds', undefined);
    });
    const { value: image, valueExists: fetched } = useLiveQuery(async () => {
      const id = playlistId.value;
      if (!id) {
        return;
      }
      const playlist = await db.playlists.get(id);
      if (!playlist) {
        return;
      }
      if (id !== playlistId.value) {
        return;
      }
      context.emit('imageIds', playlist.imageIds);
      if (playlist.imageIds[0]) {
        const imageId = playlist.imageIds[0];
        const image = await db.images.get(imageId);
        if (id !== playlistId.value) {
          return;
        }
        return image;
      }

      const tracks = await db.tracks.bulkGet(playlist.trackIds);
      const albumIds = Array.from(
        new Set(tracks.map((track) => track!.albumId))
      );
      const albums = await db.albums.bulkGet(albumIds);
      const imageIds = albums
        .map((album) => album!.imageIds[0])
        .filter((id) => id);
      const images = (await db.images.bulkGet(
        imageIds.slice(0, 4)
      )) as ResourceImage[];
      if (id !== playlistId.value) {
        return;
      }
      return images;
    }, [playlistId]);

    return {
      image,
      fetched,
    };
  },
});
</script>

<template>
  <template v-if="!fetched">
    <s-nullable-image :image="false" class="select-none" />
  </template>
  <template v-else-if="Array.isArray(image)">
    <template v-if="image.length === 0">
      <s-nullable-image class="select-none" />
    </template>
    <template v-else-if="image.length === 1">
      <s-nullable-image :image="image[0]" class="select-none" />
    </template>
    <template v-else-if="image.length === 2">
      <div class="flex flex-wrap select-none">
        <div class="w-1/2 h-1/2"></div>
        <s-nullable-image class="w-1/2 h-1/2" :image="image[0]" />
        <div class="w-1/2 h-1/2"></div>
        <s-nullable-image class="w-1/2 h-1/2" :image="image[1]" />
      </div>
    </template>
    <template v-else-if="image.length === 3">
      <div class="flex flex-wrap select-none">
        <s-nullable-image class="w-1/2 h-1/2" :image="image[0]" />
        <s-nullable-image class="w-1/2 h-1/2" :image="image[1]" />
        <s-nullable-image class="w-1/2 h-1/2" :image="image[2]" />
        <div class="w-1/2 h-1/2"></div>
      </div>
    </template>
    <template v-else>
      <div class="flex flex-wrap select-none">
        <s-nullable-image class="w-1/2 h-1/2" :image="image[0]" />
        <s-nullable-image class="w-1/2 h-1/2" :image="image[1]" />
        <s-nullable-image class="w-1/2 h-1/2" :image="image[2]" />
        <s-nullable-image class="w-1/2 h-1/2" :image="image[3]" />
      </div>
    </template>
  </template>
  <template v-else>
    <s-nullable-image :image="image" class="select-none" />
  </template>
</template>
