<script lang="ts">
import type { PropType } from 'vue';
import type { ResourceImage } from '$/types';
import noImage from '~/assets/no_image.svg';
import { SrcObject, createSrc } from '~/logic/srcSet';
import { getUserId } from '~/logic/tokens';

export default defineComponent({
  props: {
    image: {
      type: [Boolean, String, Object] as PropType<
        Pick<ResourceImage, 'id' | 'files'> | string | null | undefined | false
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
    const srcObject = computed<SrcObject | undefined>(() => {
      if (props.image == null || typeof props.image !== 'object') {
        return;
      }

      const userId = getUserId();
      if (!userId) {
        return;
      }

      return createSrc(userId, props.image, Number(props.size));
    });

    const src = computed<string | undefined>(() =>
      typeof props.image === 'string' ? props.image : undefined
    );

    const loading = computed<boolean>(() => props.image === false);

    return {
      noImageSrc$$q: noImage,
      srcObject$$q: srcObject,
      src$$q: src,
      loading$$q: loading,
    };
  },
});
</script>

<template>
  <template v-if="!srcObject$$q && !src$$q && !loading$$q">
    <img
      :alt="alt"
      :src="noImageSrc$$q"
      class="block object-cover overflow-hidden leading-none bg-true-gray-100 dark:bg-true-gray-300 text-st-text select-none pointer-events-none"
    />
  </template>
  <template v-else>
    <div class="overflow-hidden leading-none relative s-lazyload-container z-0">
      <template v-if="srcObject$$q || src$$q">
        <img
          v-lazysizes
          data-sizes="auto"
          :data-src="srcObject$$q?.src$$q ?? src$$q"
          :data-srcset="srcObject$$q?.srcSet$$q"
          :alt="alt"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII="
          class="block object-cover absolute top-0 left-0 w-full h-full s-lazyload-image z-1 pointer-events-none"
        />
      </template>
      <template v-else-if="loading$$q">
        <div
          class="block object-cover absolute top-0 left-0 w-full h-full s-lazyload-image z-1"
        ></div>
      </template>
      <div
        class="absolute top-0 left-0 w-full h-full s-lazyload-background flex items-center justify-center"
      >
        <!-- template v-if="loading$$q">
          <v-progress-circular indeterminate />
        </template -->
      </div>
    </div>
  </template>
</template>
