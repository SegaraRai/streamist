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
      <VIcon>mdi-history</VIcon>
    </VListItemAvatar>
    <VListItemHeader>
      <div class="flex-1 flex flex-col pl-2">
        <div class="s-heading-sl text-sm">
          {{ query }}
        </div>
        <div class="s-subheading-sl text-xs">
          {{ strAt$$q }}
        </div>
      </div>
    </VListItemHeader>
    <VBtn
      icon
      flat
      text
      size="18"
      class="bg-transparent text-st-error"
      @click.prevent.stop="$emit('remove', query)"
    >
      <VIcon class="s-hover-visible">mdi-close</VIcon>
    </VBtn>
  </VListItem>
</template>
