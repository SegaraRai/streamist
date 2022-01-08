<script lang="ts">
import type { PropType } from 'vue';
import type { ResourceArtist } from '$/types';
import { useMenu } from '~/logic/menu';
import { createArtistDropdown } from '~/logic/naive-ui/artistDropdown';

export interface DropdownArtistInput {
  target$$q: MouseEvent | HTMLElement;
  artist$$q: ResourceArtist;
}

export default defineComponent({
  props: {
    modelValue: {
      type: Object as PropType<DropdownArtistInput | undefined>,
      default: undefined,
    },
  },
  setup(props, { emit }) {
    const modelValue$$q = useVModel(props, 'modelValue', emit);

    const selectedArtist$$q = ref<ResourceArtist | undefined>();

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

    const menuOptions$$q = createArtistDropdown({
      artist$$q: selectedArtist$$q,
      openEditArtistDialog$$q: () => {
        dialogEdit$$q.value = true;
      },
      openMergeArtistDialog$$q: () => {
        dialogMerge$$q.value = true;
      },
      closeMenu$$q,
    });

    watch(modelValue$$q, (value) => {
      if (!value) {
        return;
      }

      openMenu$$q(value.target$$q, () => {
        selectedArtist$$q.value = value.artist$$q;

        modelValue$$q.value = undefined;
      });
    });

    return {
      selectedArtist$$q,
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
  <template v-if="selectedArtist$$q">
    <s-dialog-artist-edit v-model="dialogEdit$$q" :artist="selectedArtist$$q" />
    <s-dialog-artist-merge
      v-model="dialogMerge$$q"
      :artist="selectedArtist$$q"
    />
  </template>
</template>
