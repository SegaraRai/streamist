<script lang="ts">
import { asyncComputed } from '@vueuse/core';
import type { PropType } from 'vue';
import { SrcObject, createSrc } from '@/logic/srcSet';
import type { ResourceImage } from '$/types';

interface Props {
  image?: ResourceImage | null;
  width: number;
  height: number;
  aspectRatio?: number | string;
}

export default defineComponent({
  props: {
    image: {
      type: Object as PropType<ResourceImage | null | undefined>,
      default: undefined,
    },
    width: Number,
    height: Number,
    aspectRatio: {
      type: [Number, String],
      default: undefined,
    },
    iconSize: {
      type: [Number, String],
      default: '48px',
    },
  },
  setup(_props: unknown) {
    const props = _props as Props;

    const srcObject = asyncComputed<SrcObject | null | undefined | false>(
      async () =>
        props.image &&
        (await createSrc(
          props.image.files,
          Math.max(props.width, props.height)
        )),
      false
    );

    return {
      srcObject$$q: srcObject,
    };
  },
});
</script>

<template>
  <template v-if="srcObject$$q === false">
    <div
      class="flex align-center justify-center"
      :style="{ width: `${width}px`, height: `${height}px` }"
    >
      <v-progress-circular indeterminate />
    </div>
  </template>
  <template v-else-if="srcObject$$q">
    <v-img
      :width="`${width}px`"
      :height="`${height}px`"
      :src="srcObject$$q.src$$q"
      :srcset="srcObject$$q.srcSet$$q"
      :sizes="`${width}px`"
      :aspect-ratio="aspectRatio"
    />
  </template>
  <template v-else>
    <s-no-image
      :style="{ width: `${width}px`, height: `${height}px` }"
      :icon-size="iconSize"
    />
  </template>
</template>
