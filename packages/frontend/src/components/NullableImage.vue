<script lang="ts">
import { asyncComputed } from '@vueuse/core';
import { PropType, defineComponent } from 'vue';
import NoImage from '@/components/NoImage.vue';
import { SrcObject, createSrc } from '@/logic/srcSet';
import type { ImageWithFile } from '~/types/image';

interface Props {
  image?: ImageWithFile | null;
  width: number;
  height: number;
  aspectRatio?: number | string;
}

export default defineComponent({
  components: {
    NoImage,
  },
  props: {
    image: {
      type: Object as PropType<ImageWithFile | null | undefined>,
      default: undefined,
    },
    width: Number,
    height: Number,
    aspectRatio: {
      type: [Number, String],
      default: undefined,
    },
  },
  setup(_props: unknown) {
    const props = _props as Props;

    const srcObject = asyncComputed<SrcObject | null | undefined>(
      async () =>
        props.image &&
        (await createSrc(
          props.image.files,
          Math.max(props.width, props.height)
        ))
    );

    return {
      srcObject$$q: srcObject,
    };
  },
});
</script>

<template>
  <div>
    <template v-if="srcObject$$q">
      <v-img
        :width="`${width}px`"
        :height="`${height}px`"
        :src="srcObject$$q.src$$q"
        :srcset="srcObject$$q.srcSet$$q"
        :sizes="`${width}px`"
        :aspect-ratio="aspectRatio"
      ></v-img>
    </template>
    <template v-else>
      <no-image :style="{ width: `${width}px`, height: `${height}px` }" />
    </template>
  </div>
</template>
