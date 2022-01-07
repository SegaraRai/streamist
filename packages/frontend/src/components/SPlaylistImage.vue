<script lang="ts">
import type { PropType } from 'vue';
import type { ResourceImage, ResourcePlaylist } from '$/types';
import { db } from '~/db';
import { useLiveQuery } from '~/logic/useLiveQuery';

export default defineComponent({
  props: {
    playlist: {
      type: [String, Object] as PropType<string | ResourcePlaylist>,
      required: true,
    },
  },
  emits: {
    imageIds: (_imageIds: readonly string[] | undefined) => true,
  },
  setup(props, { emit }) {
    const propPlaylistRef = computed(() => props.playlist);
    watch(propPlaylistRef, () => {
      emit('imageIds', undefined);
    });
    const { value: image, valueExists: fetched } = useLiveQuery(async () => {
      const propPlaylist = propPlaylistRef.value;
      const playlist =
        typeof propPlaylist === 'string'
          ? await db.playlists.get(propPlaylist)
          : propPlaylist;
      if (!playlist) {
        return;
      }
      if (propPlaylist !== propPlaylistRef.value) {
        return;
      }
      emit('imageIds', playlist.imageIds);
      if (playlist.imageIds[0]) {
        const imageId = playlist.imageIds[0];
        const image = await db.images.get(imageId);
        return image;
      }

      const tracks = await db.tracks.bulkGet(playlist.trackIds as string[]);
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
      return images;
    }, [propPlaylistRef]);

    return {
      image,
      fetched,
    };
  },
});
</script>

<template>
  <template v-if="!fetched">
    <s-nullable-image
      :image="false"
      class="select-none rounded-lg overflow-hidden"
    />
  </template>
  <template v-else-if="Array.isArray(image)">
    <template v-if="image.length === 0">
      <s-nullable-image class="select-none rounded-lg overflow-hidden" />
    </template>
    <template v-else-if="image.length === 1">
      <s-nullable-image
        :image="image[0]"
        class="select-none rounded-lg overflow-hidden"
      />
    </template>
    <template v-else-if="image.length === 2">
      <div class="flex flex-wrap select-none rounded-lg overflow-hidden">
        <s-nullable-image class="w-1/2 h-1/2" :image="image[0]" />
        <div class="w-1/2 h-1/2"></div>
        <div class="w-1/2 h-1/2"></div>
        <s-nullable-image class="w-1/2 h-1/2" :image="image[1]" />
      </div>
    </template>
    <template v-else-if="image.length === 3">
      <div class="flex flex-wrap select-none rounded-lg overflow-hidden">
        <s-nullable-image class="w-1/2 h-1/2" :image="image[0]" />
        <s-nullable-image class="w-1/2 h-1/2" :image="image[1]" />
        <s-nullable-image class="w-1/2 h-1/2" :image="image[2]" />
        <div class="w-1/2 h-1/2"></div>
      </div>
    </template>
    <template v-else>
      <div class="flex flex-wrap select-none rounded-lg overflow-hidden">
        <s-nullable-image class="w-1/2 h-1/2" :image="image[0]" />
        <s-nullable-image class="w-1/2 h-1/2" :image="image[1]" />
        <s-nullable-image class="w-1/2 h-1/2" :image="image[2]" />
        <s-nullable-image class="w-1/2 h-1/2" :image="image[3]" />
      </div>
    </template>
  </template>
  <template v-else>
    <s-nullable-image
      :image="image"
      class="select-none rounded-lg overflow-hidden"
    />
  </template>
</template>
