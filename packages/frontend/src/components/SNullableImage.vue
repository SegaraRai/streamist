<script lang="ts">
import type { PropType } from 'vue';
import { SrcObject, createSrc } from '~/logic/srcSet';
import type { ResourceImage } from '$/types';

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
  },
  setup(props) {
    const srcObject = computed<SrcObject | null | undefined | false>(
      () => props.image && createSrc(props.image.files, Number(props.size))
    );

    return {
      srcObject$$q: srcObject,
    };
  },
});
</script>

<template>
  <template v-if="srcObject$$q == null">
    <s-no-image />
  </template>
  <template v-else>
    <div class="overflow-hidden leading-none relative s-lazyload-container">
      <template v-if="srcObject$$q">
        <img
          v-lazysizes
          data-sizes="auto"
          :data-src="srcObject$$q.src$$q"
          :data-srcset="srcObject$$q.srcSet$$q"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII="
          class="block object-cover absolute top-0 left-0 w-full h-full z-10 s-lazyload-image"
        />
      </template>
      <template v-else-if="srcObject$$q === false">
        <div
          class="block object-cover absolute top-0 left-0 w-full h-full z-10 s-lazyload-image"
        ></div>
      </template>
      <div
        class="absolute top-0 left-0 w-full h-full z-0 s-lazyload-background flex items-center justify-center"
      >
        <!-- template v-if="srcObject$$q === false">
          <v-progress-circular indeterminate />
        </template -->
      </div>
    </div>
  </template>
</template>
