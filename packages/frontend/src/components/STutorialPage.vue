<script lang="ts">
import { useAllTracks } from '~/composables';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const allTracks = useAllTracks();

    const needsTutorial$$q = eagerComputed(
      () => allTracks.value.value?.length === 0
    );

    return {
      t,
      needsTutorial$$q,
    };
  },
});
</script>

<template>
  <template v-if="needsTutorial$$q">
    <div class="pt-2">
      <div class="text-2xl mb-6 leading-tight">
        {{ t('tutorial.title') }}
      </div>
      <I18nT
        keypath="tutorial.message"
        tag="div"
        class="text-base leading-normal whitespace-pre-line"
      >
        <IMdiCloudUpload />
      </I18nT>
    </div>
  </template>
  <template v-else>
    <slot></slot>
  </template>
</template>
