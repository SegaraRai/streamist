<script lang="ts">
import { useTranslatedTimeAgo } from '~/composables';

export default defineComponent({
  props: {
    query: {
      type: String,
      required: true,
    },
    at: {
      type: Number,
      required: true,
    },
  },
  emits: {
    click: (_query: string) => true,
    remove: (_query: string) => true,
  },
  setup(props) {
    const at = computed(() => props.at);
    return {
      strAt$$q: useTranslatedTimeAgo(at),
    };
  },
});
</script>

<template>
  <VListItem
    class="s-hover-container flex"
    link
    @click.stop.prevent="$emit('click', query)"
  >
    <VListItemAvatar
      icon
      class="flex-none flex items-center justify-center opacity-60"
    >
      <i-mdi-history />
    </VListItemAvatar>
    <VListItemHeader class="pl-2">
      <VListItemTitle class="s-heading-sl text-sm">
        {{ query }}
      </VListItemTitle>
      <VListItemSubtitle class="s-subheading-sl text-xs">
        {{ strAt$$q }}
      </VListItemSubtitle>
    </VListItemHeader>
    <VBtn
      icon
      flat
      text
      size="18"
      class="bg-transparent text-st-error"
      @click.prevent.stop="$emit('remove', query)"
    >
      <i-mdi-close class="s-hover-visible" />
    </VBtn>
  </VListItem>
</template>
