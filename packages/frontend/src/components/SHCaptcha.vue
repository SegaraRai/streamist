<script lang="ts">
import {
  PropType,
  computed,
  defineComponent,
  onBeforeMount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { hCaptchaPromise } from '~/logic/hCaptchaPromise';
import { THEMES } from '~/logic/theme';
import { useThemeStore } from '~/stores/theme';
import type { HCaptcha } from '~/types';

export default defineComponent({
  props: {
    siteKey: {
      type: String,
      required: true,
    },
    size: {
      type: String as PropType<'normal' | 'compact'>,
      default: 'normal',
    },
    execute: {
      type: Number,
      default: 0,
    },
  },
  emits: {
    update: (_response: string | null) => true,
    open: () => true,
    close: () => true,
  },
  setup(props, { emit }) {
    const themeStore = useThemeStore();

    const captchaTheme = eagerComputed(() =>
      THEMES[themeStore.theme].dark ? 'dark' : 'light'
    );

    let widget: [HCaptcha, string] | undefined;

    watch(
      computed(() => props.execute),
      (newExecute, oldExecute) => {
        if (newExecute !== oldExecute && newExecute > 0) {
          if (widget != null) {
            widget[0].execute(widget[1]);
          }
        }
      }
    );

    const hCaptchaElement$$q = ref<HTMLDivElement | undefined>();

    const renderHCaptcha = (hCaptcha: HCaptcha): void => {
      if (!hCaptchaElement$$q.value) {
        return;
      }

      if (widget != null) {
        widget[0].remove(widget[1]);
        hCaptchaElement$$q.value.innerHTML = '';
      }

      widget = [
        hCaptcha,
        hCaptcha.render(hCaptchaElement$$q.value, {
          sitekey: props.siteKey,
          size: props.size,
          theme: captchaTheme.value,
          callback: (response: string) => {
            emit('update', response);
          },
          'open-callback': () => {
            emit('open');
          },
          'close-callback': () => {
            emit('close');
          },
          'expired-callback': () => {
            emit('update', null);
          },
        }),
      ];
    };

    onMounted(() => {
      hCaptchaPromise.then(renderHCaptcha);
    });

    onBeforeMount(() => {
      if (widget != null) {
        widget[0].remove(widget[1]);
        widget = undefined;
      }
    });

    watch(
      [computed(() => props.siteKey), computed(() => props.size), captchaTheme],
      () => {
        hCaptchaPromise.then(renderHCaptcha);
      }
    );

    return {
      hCaptchaElement$$q,
    };
  },
});
</script>

<template>
  <div ref="hCaptchaElement$$q" class="flex flex-col"></div>
</template>
