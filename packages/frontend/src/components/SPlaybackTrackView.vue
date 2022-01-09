<script lang="ts">
import type { PropType } from 'vue';
import type { ResourceTrack } from '$/types';
import { useMenu } from '~/logic/menu';
import { createTrackDropdown } from '~/logic/naive-ui/trackDropdown';

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
  setup(props) {
    const dialog$$q = ref(false);
    const lastSelectedTrack$$q = ref<ResourceTrack | undefined>();
    const {
      x$$q: menuX$$q,
      y$$q: menuY$$q,
      isOpen$$q: menuIsOpen$$q,
      close$$q: closeMenu$$q,
      open$$q: openMenu$$q,
    } = useMenu({
      closeOnScroll$$q: true,
      scrollRef$$q: ref(0),
    });
    const menuOptions$$q = createTrackDropdown({
      selectedTrack$$q: eagerComputed(() => props.track),
      isSameSetList$$q: ref(true),
      playlistId$$q: ref(),
      showVisitAlbum$$q: ref(true),
      showVisitArtist$$q: ref(true),
      showPlayback$$q: ref(false),
      play$$q: () => {},
      openEditTrackDialog$$q: (track: ResourceTrack) => {
        lastSelectedTrack$$q.value = track;
        dialog$$q.value = true;
      },
      closeMenu$$q,
    });
    return {
      lastSelectedTrack$$q,
      dialog$$q,
      menuX$$q,
      menuY$$q,
      menuOptions$$q,
      menuIsOpen$$q,
      closeMenu$$q,
      openMenu$$q,
    };
  },
});
</script>

<template>
  <div
    v-bind="$attrs"
    class="flex gap-x-4 items-center overflow-hidden"
    @contextmenu.prevent="openMenu$$q($event)"
  >
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
  <n-dropdown
    class="select-none"
    placement="bottom-start"
    trigger="manual"
    :x="menuX$$q"
    :y="menuY$$q"
    :options="menuOptions$$q"
    :show="menuIsOpen$$q"
    :on-clickoutside="closeMenu$$q"
    @contextmenu.prevent
  />
  <template v-if="lastSelectedTrack$$q">
    <s-dialog-track-edit v-model="dialog$$q" :track="lastSelectedTrack$$q" />
  </template>
</template>
