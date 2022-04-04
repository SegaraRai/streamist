<script lang="ts">
import { PropType } from 'vue';
import { compareAlbum } from '$/shared/sort';
import { ResourceArtist } from '$/types';
import { useLiveQuery } from '~/composables';
import { db } from '~/db';

export default defineComponent({
  props: {
    artist: {
      type: [String, Object] as PropType<string | ResourceArtist>,
      required: true,
    },
    expandable: Boolean,
  },
  emits: {
    imageIds: (_imageIds: readonly string[] | undefined) => true,
  },
  setup(props, { emit }) {
    const propArtistRef = computed(() => props.artist);
    watch(propArtistRef, () => {
      emit('imageIds', undefined);
    });
    const { value, valueExists: fetched } = useLiveQuery(async () => {
      const propArtist = propArtistRef.value;
      if (!propArtist) {
        return;
      }
      const artist =
        typeof propArtist === 'string'
          ? await db.artists.get(propArtist)
          : propArtist;
      if (!artist) {
        return;
      }
      if (propArtist !== propArtistRef.value) {
        return;
      }
      emit('imageIds', artist.imageIds);
      let imageId: string | undefined;
      if (artist.imageIds[0]) {
        imageId = artist.imageIds[0];
      } else {
        const albums = await db.albums.where({ artistId: artist.id }).toArray();
        albums.sort(compareAlbum);
        const imageIds = albums.flatMap((album) => album.imageIds);
        imageId = imageIds[0];
      }
      if (!imageId) {
        return;
      }
      const image = await db.images.get(imageId);
      return {
        artist$$q: artist,
        image$$q: image,
        imageIds$$q: artist.imageIds,
      };
    }, [propArtistRef]);

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
    :alt-base="value$$q?.artist$$q.name"
    :image-ids="value$$q?.imageIds$$q"
    :disabled="!expandable"
  >
    <SArtistImageX
      class="w-full h-full"
      :image="fetched$$q && value$$q?.image$$q"
      :alt="value$$q?.artist$$q.name"
    />
    <template #overlay="{ activate }">
      <VBtn
        class="absolute right-7 bottom-7 bg-opacity-80 bg-true-gray-900"
        size="small"
        flat
        icon
        @click.stop.prevent="activate()"
      >
        <VIcon icon="mdi-fullscreen" />
      </VBtn>
    </template>
  </SExpandable>
</template>
