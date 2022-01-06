<script lang="ts">
import type { PropType } from 'vue';
import type { ResourceTrack } from '$/types';

export default defineComponent({
  props: {
    track: {
      type: Object as PropType<ResourceTrack>,
      required: true,
    },
    artistName: {
      type: String,
      default: undefined,
    },
    navigatePlaying: Boolean,
  },
});
</script>

<template>
  <div class="flex gap-x-4 items-center overflow-hidden">
    <router-link class="block" :to="`/albums/${track.albumId}`">
      <s-album-image class="w-16 h-16" size="64" :album="track.albumId" />
    </router-link>
    <div class="flex-1 flex flex-col gap-y-1 overflow-hidden">
      <router-link
        class="block max-w-max whitespace-nowrap overflow-hidden overflow-ellipsis text-base leading-tight"
        :to="navigatePlaying ? '/playing' : `/albums/${track.albumId}`"
      >
        {{ track.title }}
      </router-link>
      <router-link
        class="block max-w-max whitespace-nowrap overflow-hidden overflow-ellipsis text-xs leading-tight"
        :to="`/artists/${track.artistId}`"
      >
        {{ artistName || '\u200b' /* to prevent layout shift */ }}
      </router-link>
    </div>
  </div>
</template>
