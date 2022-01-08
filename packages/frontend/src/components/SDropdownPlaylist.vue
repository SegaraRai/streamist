<script lang="ts">
import type { PropType } from 'vue';
import type { ResourcePlaylist, ResourceTrack } from '$/types';
import { useMenu } from '~/logic/menu';
import { createPlaylistDropdown } from '~/logic/naive-ui/playlistDropdown';

export interface DropdownPlaylistInput {
  target$$q: MouseEvent | HTMLElement;
  playlist$$q: ResourcePlaylist;
  tracks$$q: readonly ResourceTrack[];
}

export default defineComponent({
  props: {
    modelValue: {
      type: Object as PropType<DropdownPlaylistInput | undefined>,
      default: undefined,
    },
    showCreateDialog: Boolean,
    showCreateItem: Boolean,
  },
  setup(props, { emit }) {
    const modelValue$$q = useVModel(props, 'modelValue', emit);
    const showCreateDialog$$q = useVModel(props, 'showCreateDialog', emit);

    const selectedPlaylist$$q = ref<ResourcePlaylist | undefined>();
    const selectedPlaylistTracks$$q = ref<
      readonly ResourceTrack[] | undefined
    >();

    const dialog$$q = ref(false);
    const createDialog$$q = ref(false);

    const {
      x$$q: menuX$$q,
      y$$q: menuY$$q,
      isOpen$$q: menuIsOpen$$q,
      close$$q: closeMenu$$q,
      open$$q: openMenu$$q,
    } = useMenu({
      closeOnScroll$$q: true,
    });
    const menuOptions$$q = createPlaylistDropdown({
      playlist$$q: selectedPlaylist$$q,
      playlistTracks$$q: selectedPlaylistTracks$$q,
      moveWhenDelete$$q: ref(true),
      showCreatePlaylist$$q: eagerComputed(() => props.showCreateItem),
      openEditPlaylistDialog$$q: () => {
        dialog$$q.value = true;
      },
      openCreatePlaylistDialog$$q: () => {
        createDialog$$q.value = true;
      },
      closeMenu$$q,
    });

    watch(modelValue$$q, (value) => {
      if (!value) {
        return;
      }

      openMenu$$q(value.target$$q, () => {
        selectedPlaylist$$q.value = value.playlist$$q;
        selectedPlaylistTracks$$q.value = value.tracks$$q;

        modelValue$$q.value = undefined;
      });
    });

    watch(showCreateDialog$$q, (value) => {
      if (!value) {
        return;
      }

      createDialog$$q.value = true;

      showCreateDialog$$q.value = false;
    });

    return {
      selectedPlaylist$$q,
      createDialog$$q,
      dialog$$q,
      menuOptions$$q,
      menuIsOpen$$q,
      menuX$$q,
      menuY$$q,
      closeMenu$$q,
    };
  },
});
</script>

<template>
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
  <template v-if="selectedPlaylist$$q">
    <s-dialog-playlist-edit
      v-model="dialog$$q"
      :playlist="selectedPlaylist$$q"
    />
  </template>
  <s-dialog-playlist-create v-model="createDialog$$q" />
</template>
