<script lang="ts">
import { defineComponent } from 'vue';

type EventHandler = (event: Event) => unknown;

/**
 * activatorの幅がその親要素の幅より大きいときだけツールチップを表示する`VTooltip`のラッパー \
 * 主にactivatorに`text-overflow: ellipsis`を適用していて省略表示される場合を想定している \
 * （ただしactivatorに`text-overflow`が適用されているかどうかは確認していない）
 */
export default defineComponent({
  props: [
    /* eslint-disable vue/require-prop-types */
    'absolute',
    'activator',
    'allowOverflow',
    'attach',
    'bottom',
    'closeDelay',
    'color',
    'contentClass',
    'disabled',
    'eager',
    'fixed',
    'internalActivator',
    'left',
    'maxWidth',
    'minWidth',
    'nudgeBottom',
    'nudgeLeft',
    'nudgeRight',
    'nudgeTop',
    'nudgeWidth',
    'offsetOverflow',
    'openDelay',
    'openOnClick',
    'openOnFocus',
    'positionX',
    'positionY',
    'right',
    'tag',
    'top',
    'transition',
    'value',
    'zIndex',
    /* eslint-enable vue/require-prop-types */
  ],
  setup() {
    return {
      proxyOn$$q(
        object: Record<string, EventHandler>
      ): Record<string, EventHandler> {
        return Object.fromEntries(
          Object.entries(object).map(([key, originalHandler]) => [
            key,
            (event: Event): void => {
              // 省略表示されているとき（＝ツールチップ対象の要素が親要素より大きいとき）だけ元のイベントハンドラを発火する
              // 何らかの理由で判定ができない場合はハンドラを呼び出すこととする
              const target = event.target;
              if (target instanceof HTMLElement) {
                const targetWidth = target.offsetWidth ?? Infinity;
                const parentWidth = target.parentElement?.offsetWidth ?? -1;
                if (targetWidth <= parentWidth) {
                  return;
                }
              }
              originalHandler(event);
            },
          ])
        );
      },
    };
  },
});
</script>

<template>
  <v-tooltip
    :absolute="absolute"
    :activator="activator"
    :allow-overflow="allowOverflow"
    :attach="attach"
    :bottom="bottom"
    :close-delay="closeDelay"
    :color="color"
    :content-class="contentClass"
    :disabled="disabled"
    :eager="eager"
    :fixed="fixed"
    :internal-activator="internalActivator"
    :left="left"
    :max-width="maxWidth"
    :min-width="minWidth"
    :nudge-bottom="nudgeBottom"
    :nudge-left="nudgeLeft"
    :nudge-right="nudgeRight"
    :nudge-top="nudgeTop"
    :nudge-width="nudgeWidth"
    :offset-overflow="offsetOverflow"
    :open-delay="openDelay"
    :open-on-click="openOnClick"
    :open-on-focus="openOnFocus"
    :position-x="positionX"
    :position-y="positionY"
    :right="right"
    :tag="tag"
    :top="top"
    :transition="transition"
    :value="value"
    :z-index="zIndex"
  >
    <template #activator="activator">
      <slot
        name="activator"
        :on="proxyOn$$q(activator.on)"
        :attr="activator.attr"
      ></slot>
    </template>
    <slot></slot>
  </v-tooltip>
</template>
