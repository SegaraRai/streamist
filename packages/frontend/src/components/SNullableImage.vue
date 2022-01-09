<script lang="ts">
import type { PropType } from 'vue';
import type { ResourceImage } from '$/types';
import noImage from '~/assets/no_image.svg';
import { SrcObject, createSrc } from '~/logic/srcSet';

export default defineComponent({
  props: {
    image: {
      type: [Boolean, Object] as PropType<
        ResourceImage | null | undefined | false
      >,
      default: undefined,
    },
    size: {
      type: [Number, String],
      default: 0,
    },
    alt: {
      type: String,
      default: undefined,
    },
  },
  setup(props) {
    const srcObject = computed<SrcObject | null | undefined | false>(
      () => props.image && createSrc(props.image.files, Number(props.size))
    );

    return {
      noImageSrc$$q: noImage,
      srcObject$$q: srcObject,
    };
  },
});
</script>

<template>
  <template v-if="srcObject$$q == null">
    <img
      :src="noImageSrc$$q"
      class="block object-cover overflow-hidden leading-none bg-true-gray-300 text-white"
    />
  </template>
  <template v-else>
    <div class="overflow-hidden leading-none relative s-lazyload-container z-0">
      <template v-if="srcObject$$q">
        <img
          v-lazysizes
          data-sizes="auto"
          :data-src="srcObject$$q.src$$q"
          :data-srcset="srcObject$$q.srcSet$$q"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII="
          class="block object-cover absolute top-0 left-0 w-full h-full s-lazyload-image z-1"
          :alt="alt"
        />
      </template>
      <template v-else-if="srcObject$$q === false">
        <div
          class="block object-cover absolute top-0 left-0 w-full h-full s-lazyload-image z-1"
        ></div>
      </template>
      <div
        class="absolute top-0 left-0 w-full h-full s-lazyload-background flex items-center justify-center"
      >
        <!-- template v-if="srcObject$$q === false">
          <v-progress-circular indeterminate />
        </template -->
      </div>
    </div>
  </template>
</template>
