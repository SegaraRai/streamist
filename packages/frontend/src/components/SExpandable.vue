<script lang="ts">
import type { PropType } from 'vue';
import { filterNullAndUndefined } from '$shared/filter';
import { useLiveQuery } from '~/composables';
import { db } from '~/db';
import { createSrc } from '~/logic/srcSet';
import { getUserId } from '~/logic/tokens';

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
      return filterNullAndUndefined(
        await db.images.bulkGet([...imageIds$$q.value])
      );
    }, [imageIds$$q]);

    const resolvedImages = computed(() => {
      if (!images$$q.value) {
        return;
      }
      const userId = getUserId();
      if (!userId) {
        return;
      }
      return filterNullAndUndefined(
        images$$q.value.map((image, index) => {
          const src = createSrc(userId, image, Infinity);
          if (!src) {
            return undefined;
          }
          return {
            index$$q: index,
            src$$q: src,
          };
        })
      );
    });

    const enabled = eagerComputed(
      () => !props.disabled && !!resolvedImages.value?.length
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
          <VBtn
            class="absolute right-2 bottom-2 text-white bg-black/30 hover:bg-black/60 transition"
            size="small"
            flat
            icon
            @click.stop.prevent="activate$$q()"
          >
            <VIcon>mdi-fullscreen</VIcon>
          </VBtn>
        </slot>
      </div>
    </div>
  </template>
  <template v-else>
    <div class="relative" v-bind="$attrs">
      <slot></slot>
    </div>
  </template>
  <template v-if="resolvedImages$$q">
    <NModal v-model:show="modelValue$$q" class="select-none w-full h-full">
      <div class="relative w-full h-full">
        <NCarousel draggable show-arrow keyboard>
          <template v-for="image in resolvedImages$$q" :key="image.index$$q">
            <img
              class="w-screen h-screen object-contain"
              :alt="`Image #${image.index$$q + 1} of ${altBase}`"
              :src="image.src$$q.src$$q"
              :srcset="image.src$$q.srcSet$$q"
            />
          </template>
        </NCarousel>
        <div class="absolute top-1 right-1">
          <VBtn
            class="text-st-error bg-true-gray-500/60 dark:bg-true-gray-900/80"
            flat
            icon
            size="x-small"
            @click="modelValue$$q = false"
          >
            <VIcon>mdi-close</VIcon>
          </VBtn>
        </div>
      </div>
    </NModal>
  </template>
</template>
