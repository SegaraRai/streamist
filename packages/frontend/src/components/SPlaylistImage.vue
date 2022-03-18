<script lang="ts">
import type { PropType } from 'vue';
import { filterNullAndUndefined } from '$shared/filter';
import { toUnique } from '$shared/unique';
import type { ResourcePlaylist } from '$/types';
import { useLiveQuery } from '~/composables';
import { db } from '~/db';

export default defineComponent({
  inheritAttrs: false,
  props: {
    playlist: {
      type: [String, Object] as PropType<string | ResourcePlaylist>,
      required: true,
    },
    expandable: Boolean,
  },
  emits: {
    imageIds: (_imageIds: readonly string[] | undefined) => true,
  },
  setup(props, { emit }) {
    const propPlaylistRef = computed(() => props.playlist);
    watch(propPlaylistRef, () => {
      emit('imageIds', undefined);
    });
    const { value, valueExists: fetched } = useLiveQuery(async () => {
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
      const { imageIds } = playlist;
      emit('imageIds', imageIds);
      if (imageIds.length > 0) {
        const imageId = imageIds[0];
        const image = await db.images.get(imageId);
        return {
          playlist$$q: playlist,
          image$$q: image,
          imageIds$$q: imageIds,
        };
      }

      const tracks = filterNullAndUndefined(
        await db.tracks.bulkGet(playlist.trackIds as string[])
      );
      const albumIds = toUnique(tracks.map((track) => track.albumId));
      const albums = filterNullAndUndefined(await db.albums.bulkGet(albumIds));
      const albumImageIds = filterNullAndUndefined(
        albums.map((album) => album.imageIds[0])
      );
      const images = filterNullAndUndefined(
        await db.images.bulkGet(albumImageIds.slice(0, 4))
      );
      return {
        playlist$$q: playlist,
        image$$q: images,
        imageIds$$q: [],
      };
    }, [propPlaylistRef]);

    const expanded$$q = ref(false);

    return {
      value$$q: value,
      image$$q: computed(() => value.value?.image$$q),
      fetched$$q: fetched,
      expanded$$q,
    };
  },
});
</script>

<template>
  <template v-if="!fetched$$q">
    <SNullableImage
      v-bind="$attrs"
      :image="false"
      class="select-none rounded-lg overflow-hidden"
    />
  </template>
  <template v-else-if="Array.isArray(image$$q)">
    <template v-if="image$$q.length === 0">
      <SNullableImage
        v-bind="$attrs"
        class="select-none rounded-lg overflow-hidden"
      />
    </template>
    <template v-else-if="image$$q.length === 1">
      <SNullableImage
        v-bind="$attrs"
        :image="image$$q[0]"
        class="select-none rounded-lg overflow-hidden"
      />
    </template>
    <template v-else-if="image$$q.length === 2">
      <div
        v-bind="$attrs"
        class="flex flex-wrap select-none rounded-lg overflow-hidden"
      >
        <SNullableImage class="w-1/2 h-1/2" :image="image$$q[0]" />
        <div class="w-1/2 h-1/2"></div>
        <div class="w-1/2 h-1/2"></div>
        <SNullableImage class="w-1/2 h-1/2" :image="image$$q[1]" />
      </div>
    </template>
    <template v-else-if="image$$q.length === 3">
      <div
        v-bind="$attrs"
        class="flex flex-wrap select-none rounded-lg overflow-hidden"
      >
        <SNullableImage class="w-1/2 h-1/2" :image="image$$q[0]" />
        <SNullableImage class="w-1/2 h-1/2" :image="image$$q[1]" />
        <SNullableImage class="w-1/2 h-1/2" :image="image$$q[2]" />
        <div class="w-1/2 h-1/2"></div>
      </div>
    </template>
    <template v-else>
      <div
        v-bind="$attrs"
        class="flex flex-wrap select-none rounded-lg overflow-hidden"
      >
        <SNullableImage class="w-1/2 h-1/2" :image="image$$q[0]" />
        <SNullableImage class="w-1/2 h-1/2" :image="image$$q[1]" />
        <SNullableImage class="w-1/2 h-1/2" :image="image$$q[2]" />
        <SNullableImage class="w-1/2 h-1/2" :image="image$$q[3]" />
      </div>
    </template>
  </template>
  <template v-else>
    <SExpandable
      v-bind="$attrs"
      v-model="expanded$$q"
      :alt-base="value$$q?.playlist$$q.title"
      :image-ids="value$$q?.imageIds$$q"
      :disabled="!expandable"
    >
      <SNullableImage
        :image="image$$q"
        class="select-none rounded-lg overflow-hidden w-full h-full"
      />
    </SExpandable>
  </template>
</template>
