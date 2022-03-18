<script lang="ts">
import type { PropType } from 'vue';
import type { ResourceTrack } from '$/types';
import { useMenu, useNDropdownTrack } from '~/composables';

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
    sessionName: {
      type: String,
      default: undefined,
    },
    navigatePlaying: Boolean,
  },
  setup(props) {
    const { t } = useI18n();
    const dialogEdit$$q = ref(false);
    const dialogDetails$$q = ref(false);
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
    const menuOptions$$q = useNDropdownTrack({
      selectedTrack$$q: computedEager(() => props.track),
      isSameSetList$$q: ref(true),
      playlistId$$q: ref(),
      showVisitAlbum$$q: ref(true),
      showVisitArtist$$q: ref(true),
      showPlayback$$q: ref(false),
      showDelete$$q: ref(false),
      play$$q: () => {
        // do nothing (as this is not shown in the menu)
      },
      openEditTrackDialog$$q: (track: ResourceTrack) => {
        lastSelectedTrack$$q.value = track;
        dialogEdit$$q.value = true;
      },
      openTrackDetailsDialog$$q: (track: ResourceTrack) => {
        lastSelectedTrack$$q.value = track;
        dialogDetails$$q.value = true;
      },
      closeMenu$$q,
    });
    return {
      t,
      lastSelectedTrack$$q,
      dialogEdit$$q,
      dialogDetails$$q,
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
    <RouterLink class="block" :to="`/albums/${track.albumId}`">
      <SAlbumImage class="w-16 h-16" size="64" :album="track.albumId" />
    </RouterLink>
    <div class="flex-1 flex flex-col gap-y-1 overflow-hidden">
      <RouterLink
        class="s-heading-sl block max-w-max text-base"
        :to="navigatePlaying ? '#playing' : `/albums/${track.albumId}`"
      >
        {{ track.title }}
      </RouterLink>
      <RouterLink
        class="s-subheading-sl block max-w-max text-xs"
        :to="`/artists/${track.artistId}`"
      >
        {{ artistName || '\u200b' /* to prevent layout shift */ }}
      </RouterLink>
      <template v-if="sessionName">
        <i18n-t
          keypath="session.ListeningOn"
          tag="div"
          class="text-xs text-st-primary leading-tight pt-2px"
        >
          <span class="font-bold">
            {{ sessionName }}
          </span>
        </i18n-t>
      </template>
    </div>
  </div>
  <NDropdown
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
    <SDialogTrackEdit v-model="dialogEdit$$q" :track="lastSelectedTrack$$q" />
    <SDialogTrackDetails
      v-model="dialogDetails$$q"
      :track="lastSelectedTrack$$q"
    />
  </template>
</template>
