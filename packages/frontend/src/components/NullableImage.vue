<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import NoImage from '@/components/NoImage.vue';
import { /*type*/ ImageDTOWithImageFiles } from '@/lib/dto';
import { SrcObject, createSrc } from '@/lib/srcSet';

interface Props {
  image?: ImageDTOWithImageFiles;
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
      type: Object,
      required: false,
    },
    width: Number,
    height: Number,
    aspectRatio: {
      type: [Number, String],
      required: false,
    },
  },
  setup(_props: unknown) {
    const props = _props as Props;

    const srcObject = computed<SrcObject | undefined>(
      () =>
        props.image &&
        createSrc(props.image.imageFiles, Math.max(props.width, props.height))
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
      <no-image
        :style="{ width: `${width}px`, height: `${height}px` }"
      ></no-image>
    </template>
  </div>
</template>
