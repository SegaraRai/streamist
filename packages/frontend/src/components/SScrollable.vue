<script lang="ts">
import { clamp } from '$shared/clamp';
import {
  SCROLLABLE_V_THUMB_SIZE_MAX,
  SCROLLABLE_V_THUMB_SIZE_MIN,
  SCROLLABLE_V_TRACK_MARGIN,
} from '~/config';

export default defineComponent({
  props: {
    emulate: Boolean,
    containerAttrs: {
      type: Object,
      default: undefined,
    },
    contentAttrs: {
      type: Object,
      default: undefined,
    },
    scrollY: {
      type: Number,
      default: undefined,
    },
  },
  emits: {
    'update:scrollY': (_value: number) => true,
    'update:container': (_value: HTMLDivElement) => true,
    'update:content': (_value: HTMLDivElement) => true,
  },
  setup(props, { emit }) {
    const eContainer$$q = ref<HTMLDivElement | null | undefined>();
    const eContent$$q = ref<HTMLDivElement | null | undefined>();

    watchEffect(() => {
      if (eContainer$$q.value) {
        emit('update:container', eContainer$$q.value);
      }
    });

    watchEffect(() => {
      if (eContent$$q.value) {
        emit('update:content', eContent$$q.value);
      }
    });

    //

    const { height: containerHeight } = useElementSize(eContainer$$q);
    const { height: contentHeight } = useElementSize(eContent$$q);
    const { y: vPosition } = useScroll(eContainer$$q, {
      eventListenerOptions: { passive: true },
    });

    const { pressed } = useMousePressed();
    const { elementY: vMousePosition } = useMouseInElement(eContainer$$q);

    //

    const vDragging$$q = ref(false);
    /** in px, >= 0 */
    const vDragThumbOffset$$q = ref(0);

    /** in px, >= 0 */
    const vThumbPosition = ref(0);
    /** in px, >= 0 */
    const vThumbLength = ref(0);

    const vRecalculate = (): void => {
      if (contentHeight.value > containerHeight.value) {
        // it is obvious that contentHeight is greater than 0
        const thumbSizeRate = clamp(
          containerHeight.value / contentHeight.value,
          SCROLLABLE_V_THUMB_SIZE_MAX,
          SCROLLABLE_V_THUMB_SIZE_MIN
        );

        const maxThumbPositionRate = 1 - thumbSizeRate;
        const maxScrollValue = contentHeight.value - containerHeight.value;

        vThumbLength.value = thumbSizeRate * containerHeight.value;
        vThumbPosition.value =
          clamp(vPosition.value / maxScrollValue) *
          maxThumbPositionRate *
          (containerHeight.value - SCROLLABLE_V_TRACK_MARGIN);
      } else {
        vThumbLength.value = 0;
        vThumbPosition.value = 0;
      }

      emit('update:scrollY', vPosition.value);
    };

    watch([containerHeight, contentHeight, vPosition], vRecalculate);

    watch([vDragging$$q, vMousePosition], ([newDragging, newPosition]) => {
      if (
        !newDragging ||
        !eContainer$$q.value ||
        !eContent$$q.value ||
        !vThumbLength.value
      ) {
        return;
      }

      const thumbStartPosition = newPosition - vDragThumbOffset$$q.value;
      const mouseMax =
        containerHeight.value - SCROLLABLE_V_TRACK_MARGIN - vThumbLength.value;
      const scrollMax = contentHeight.value - containerHeight.value;
      const newScroll = clamp(thumbStartPosition / mouseMax) * scrollMax;

      eContainer$$q.value.scrollTop = newScroll;
    });

    watch(
      computed(() => props.scrollY),
      (newScrollY): void => {
        if (newScrollY == null || !eContainer$$q.value) {
          return;
        }

        eContainer$$q.value.scrollTop = newScrollY;
      }
    );

    //

    watch(pressed, (newPressed) => {
      if (!newPressed) {
        vDragging$$q.value = false;
      }
    });

    //

    return {
      eContainer$$q,
      eContent$$q,
      vp: computed(() => `${vThumbPosition.value}px`),
      vs: computed(() => `${vThumbLength.value}px`),
      vThumbLength$$q: vThumbLength,
      vDragging$$q,
      vOnMouseDown$$q: () => {
        if (vDragging$$q.value) {
          return;
        }

        vDragThumbOffset$$q.value = vMousePosition.value - vThumbPosition.value;
        vDragging$$q.value = true;
      },
    };
  },
});
</script>

<template>
  <div
    class="s-scrollable relative flex overflow-hidden"
    :class="emulate ? 's-scrollable--emulation' : 's-scrollable--native'"
  >
    <div
      ref="eContainer$$q"
      v-bind="containerAttrs"
      class="s-scrollable-container flex-1"
    >
      <div
        ref="eContent$$q"
        v-bind="contentAttrs"
        class="s-scrollable-content min-h-full"
      >
        <slot></slot>
      </div>
    </div>
    <template v-if="emulate">
      <div
        class="s-scrollable-track s-scrollable-track--vertical transition-opacity select-none pointer-events-none absolute top-0 right-0 h-full"
        :class="[
          vDragging$$q && 's-scrollable-track--dragging',
          vThumbLength$$q && 's-scrollable-track--visible',
        ]"
      >
        <div
          class="s-scrollable-thumb s-scrollable-thumb--vertical pointer-events-auto cursor-pointer opacity-20 pr-1 flex items-center justify-center"
          @mousedown.left="vOnMouseDown$$q"
        >
          <div class="rounded-full bg-st-text w-5px h-full"></div>
        </div>
      </div>
    </template>
  </div>
</template>

<style>
.s-scrollable--emulation > .s-scrollable-container {
  scrollbar-width: none;
  overflow: scroll;
}

.s-scrollable--native > .s-scrollable-container {
  overflow: auto;
}

.s-scrollable-track {
  opacity: 0;
}

.s-scrollable:hover > .s-scrollable-track.s-scrollable-track--visible,
.s-scrollable-track.s-scrollable-track--visible.s-scrollable-track--dragging {
  opacity: 100;
}

.s-scrollable--emulation > .s-scrollable-container::-webkit-scrollbar,
.s-scrollable--emulation > .s-scrollable-container::-webkit-scrollbar-thumb,
.s-scrollable--emulation
  > .s-scrollable-container::-webkit-scrollbar-track-piece {
  display: none;
  width: 0;
  height: 0;
}

.s-scrollable-thumb--vertical {
  transform: translate3d(0, v-bind('vp'), 0);
  height: v-bind('vs');
}
</style>
