<script lang="ts">
import { useTranslatedTimeAgo } from '~/composables/timeAgo';

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
  <v-list-item
    class="s-hover-container flex"
    link
    @click.stop.prevent="$emit('click', query)"
  >
    <v-list-item-avatar icon class="flex-none flex items-center justify-center">
      <v-icon>mdi-history</v-icon>
    </v-list-item-avatar>
    <v-list-item-header>
      <div class="flex-1 flex flex-col pl-2">
        <div
          class="text-sm whitespace-nowrap overflow-hidden overflow-ellipsis"
        >
          {{ query }}
        </div>
        <div class="text-xs opacity-60">
          {{ strAt$$q }}
        </div>
      </div>
    </v-list-item-header>
    <v-btn
      icon
      flat
      text
      size="18"
      class="bg-transparent text-st-error"
      @click.prevent.stop="$emit('remove', query)"
    >
      <v-icon class="s-hover-visible"> mdi-close </v-icon>
    </v-btn>
  </v-list-item>
</template>
