<script lang="ts">
import type { PropType } from 'vue';
import type { ResourceAlbum, ResourceTrack } from '$/types';
import { useMenu, useNDropdownAlbum } from '~/composables';

export interface DropdownAlbumInput {
  target$$q: MouseEvent | HTMLElement;
  album$$q: ResourceAlbum;
  tracks$$q: readonly ResourceTrack[];
}

export default defineComponent({
  props: {
    modelValue: {
      type: Object as PropType<DropdownAlbumInput | undefined>,
      default: undefined,
    },
  },
  emits: {
    'update:modelValue': (_modelValue: DropdownAlbumInput | undefined) => true,
  },
  setup(props, { emit }) {
    const modelValue$$q = useVModel(props, 'modelValue', emit);

    const selectedAlbum$$q = ref<ResourceAlbum | undefined>();
    const selectedAlbumTracks$$q = ref<readonly ResourceTrack[] | undefined>();

    const dialogEdit$$q = ref(false);
    const dialogMerge$$q = ref(false);

    const {
      x$$q: menuX$$q,
      y$$q: menuY$$q,
      isOpen$$q: menuIsOpen$$q,
      close$$q: closeMenu$$q,
      open$$q: openMenu$$q,
    } = useMenu({
      closeOnScroll$$q: true,
    });

    const menuOptions$$q = useNDropdownAlbum({
      album$$q: selectedAlbum$$q,
      albumTracks$$q: selectedAlbumTracks$$q,
      openEditAlbumDialog$$q: () => {
        dialogEdit$$q.value = true;
      },
      openMergeAlbumDialog$$q: () => {
        dialogMerge$$q.value = true;
      },
      closeMenu$$q,
    });

    watch(modelValue$$q, () => {
      const value = modelValue$$q.value as DropdownAlbumInput | undefined;
      if (!value) {
        return;
      }

      openMenu$$q(value.target$$q, () => {
        selectedAlbum$$q.value = value.album$$q;
        selectedAlbumTracks$$q.value = value.tracks$$q;

        modelValue$$q.value = undefined;
      });
    });

    return {
      selectedAlbum$$q,
      dialogEdit$$q,
      dialogMerge$$q,
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
  <template v-if="selectedAlbum$$q">
    <SDialogAlbumEdit v-model="dialogEdit$$q" :album="selectedAlbum$$q" />
    <SDialogAlbumMerge v-model="dialogMerge$$q" :album="selectedAlbum$$q" />
  </template>
</template>
