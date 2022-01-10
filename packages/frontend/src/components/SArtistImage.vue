<script lang="ts">
import { PropType } from 'vue';
import { compareAlbum } from '$shared/sort';
import { ResourceArtist } from '$/types';
import { db } from '~/db';
import { useLiveQuery } from '~/logic/useLiveQuery';

export default defineComponent({
  props: {
    artist: {
      type: [String, Object] as PropType<string | ResourceArtist>,
      required: true,
    },
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
      };
    }, [propArtistRef]);

    return {
      value$$q: value,
      fetched$$q: fetched,
    };
  },
});
</script>

<template>
  <s-artist-image-x
    :image="fetched$$q && value$$q?.image$$q"
    :alt="value$$q?.artist$$q.name"
  />
</template>
