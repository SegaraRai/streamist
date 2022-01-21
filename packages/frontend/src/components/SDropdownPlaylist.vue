<script lang="ts">
import type { PropType } from 'vue';
import type { ResourcePlaylist, ResourceTrack } from '$/types';
import { useMenu, useNDropdownPlaylist } from '~/composables';

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
  emits: {
    'update:modelValue': (_modelValue: DropdownPlaylistInput | undefined) =>
      true,
    'update:showCreateDialog': (_value: Boolean) => true,
    'update:selectedPlaylist': (_value: ResourcePlaylist | undefined) => true,
  },
  setup(props, { emit }) {
    const modelValue$$q = useVModel(props, 'modelValue', emit);
    const showCreateDialog$$q = useVModel(props, 'showCreateDialog', emit);

    const selectedPlaylist$$q = ref<ResourcePlaylist | undefined>();
    const selectedPlaylistTracks$$q = ref<
      readonly ResourceTrack[] | undefined
    >();

    const dialogEdit$$q = ref(false);
    const dialogCreate$$q = ref(false);

    const {
      x$$q: menuX$$q,
      y$$q: menuY$$q,
      isOpen$$q: menuIsOpen$$q,
      close$$q: closeMenu$$q,
      open$$q: openMenu$$q,
    } = useMenu({
      closeOnScroll$$q: true,
      onClose$$q: () => {
        emit('update:selectedPlaylist', undefined);
      },
    });
    const menuOptions$$q = useNDropdownPlaylist({
      playlist$$q: selectedPlaylist$$q,
      playlistTracks$$q: selectedPlaylistTracks$$q,
      showCreatePlaylist$$q: eagerComputed(() => props.showCreateItem),
      openEditPlaylistDialog$$q: () => {
        dialogEdit$$q.value = true;
      },
      openCreatePlaylistDialog$$q: () => {
        dialogCreate$$q.value = true;
      },
      closeMenu$$q,
    });

    watch(modelValue$$q, () => {
      const value = modelValue$$q.value as DropdownPlaylistInput | undefined;
      if (!value) {
        return;
      }

      openMenu$$q(value.target$$q, () => {
        selectedPlaylist$$q.value = value.playlist$$q;
        selectedPlaylistTracks$$q.value = value.tracks$$q;

        modelValue$$q.value = undefined;

        emit('update:selectedPlaylist', value.playlist$$q);
      });
    });

    watch(showCreateDialog$$q, (value) => {
      if (!value) {
        return;
      }

      dialogCreate$$q.value = true;

      showCreateDialog$$q.value = false;
    });

    return {
      selectedPlaylist$$q,
      dialogCreate$$q,
      dialogEdit$$q,
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
  <template v-if="selectedPlaylist$$q">
    <SDialogPlaylistEdit
      v-model="dialogEdit$$q"
      :playlist="selectedPlaylist$$q"
    />
  </template>
  <SDialogPlaylistCreate v-model="dialogCreate$$q" />
</template>
