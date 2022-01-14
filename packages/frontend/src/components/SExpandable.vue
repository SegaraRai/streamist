<script lang="ts">
import type { PropType } from 'vue';
import { db } from '~/db';
import { createSrc } from '~/logic/srcSet';
import { useLiveQuery } from '~/logic/useLiveQuery';

export default defineComponent({
  props: {
    modelValue: Boolean,
    disabled: Boolean,
    imageIds: {
      type: Array as PropType<readonly string[]>,
      default: () => [],
    },
    altBase: {
      type: String,
      default: '',
    },
  },
  emits: {
    'update:modelValue': (_modelValue: boolean) => true,
  },
  setup(props, { emit }) {
    const modelValue$$q = useVModel(props, 'modelValue', emit);

    const imageIds$$q = computed(() => props.imageIds);
    const { value: images$$q } = useLiveQuery(async () => {
      if (!imageIds$$q.value) {
        return;
      }
      if (imageIds$$q.value.length === 0) {
        return [];
      }
      return await db.images.bulkGet([...imageIds$$q.value]);
    }, [imageIds$$q]);

    const resolvedImages = computed(() => {
      if (!images$$q.value) {
        return [];
      }
      return images$$q.value
        .map((image, index) => {
          if (!image) {
            return undefined;
          }
          const src = createSrc(image.files, Infinity);
          if (!src) {
            return undefined;
          }
          return {
            index$$q: index,
            src$$q: src,
          };
        })
        .filter((item): item is NonNullable<typeof item> => !!item);
    });

    const enabled = eagerComputed(
      () => !props.disabled && resolvedImages.value.length > 0
    );
    watch(enabled, (newEnabled) => {
      if (!newEnabled) {
        modelValue$$q.value = false;
      }
    });

    return {
      modelValue$$q,
      enabled$$q: enabled,
      activate$$q: () => {
        modelValue$$q.value = true;
      },
      resolvedImages$$q: resolvedImages,
    };
  },
});
</script>

<template>
  <template v-if="enabled$$q">
    <div class="relative" v-bind="$attrs">
      <slot></slot>
      <div class="absolute w-full h-full top-0 left-0 right-0 bottom-0">
        <slot name="overlay" :activate="activate$$q">
          <v-btn
            class="absolute right-2 bottom-2 bg-opacity-80 bg-true-gray-900"
            size="small"
            flat
            icon
            @click.stop.prevent="activate$$q()"
          >
            <v-icon>mdi-fullscreen</v-icon>
          </v-btn>
        </slot>
      </div>
    </div>
  </template>
  <template v-else>
    <div class="relative" v-bind="$attrs">
      <slot></slot>
    </div>
  </template>
  <n-modal v-model:show="modelValue$$q" class="select-none w-full h-full">
    <div class="relative w-full h-full">
      <n-carousel draggable show-arrow keyboard>
        <template v-for="image in resolvedImages$$q" :key="image.index$$q">
          <img
            class="w-screen h-screen object-contain"
            :alt="`Image #${image.index$$q + 1} of ${altBase}`"
            :src="image.src$$q.src$$q"
            :srcset="image.src$$q.srcSet$$q"
          />
        </template>
      </n-carousel>
      <div class="absolute top-1 right-1">
        <v-btn
          class="text-st-error bg-opacity-80 bg-true-gray-900"
          flat
          icon
          size="x-small"
          @click="modelValue$$q = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
    </div>
  </n-modal>
</template>
