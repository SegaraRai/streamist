<script lang="ts">
import type { PropType } from 'vue';
import type { ResourceAlbum, ResourceTrack } from '$/types';
import { useMenu } from '~/logic/menu';
import { createAlbumDropdown } from '~/logic/naive-ui/albumDropdown';

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
  setup(props, { emit }) {
    const modelValue$$q = useVModel(props, 'modelValue', emit);

    const selectedAlbum$$q = ref<ResourceAlbum | undefined>();
    const selectedAlbumTracks$$q = ref<readonly ResourceTrack[] | undefined>();

    const dialog$$q = ref(false);
    const {
      x$$q: menuX$$q,
      y$$q: menuY$$q,
      isOpen$$q: menuIsOpen$$q,
      close$$q: closeMenu$$q,
      open$$q: openMenu$$q,
    } = useMenu({
      closeOnScroll$$q: true,
    });
    const menuOptions$$q = createAlbumDropdown({
      album$$q: selectedAlbum$$q,
      albumTracks$$q: selectedAlbumTracks$$q,
      openEditAlbumDialog$$q: () => {
        dialog$$q.value = true;
      },
      closeMenu$$q,
    });

    watch(modelValue$$q, (value) => {
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
  <template v-if="selectedAlbum$$q">
    <s-dialog-album-edit v-model="dialog$$q" :album="selectedAlbum$$q" />
  </template>
</template>
