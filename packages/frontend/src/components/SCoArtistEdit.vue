<script lang="ts">
import type { PropType } from 'vue';
import { builtinCoArtistRoles } from '$shared/coArtist';
import type { CoArtist } from '~/logic/coArtist';
import { roleToText } from '~/logic/role';

export default defineComponent({
  props: {
    modelValue: {
      type: Array as PropType<CoArtist[]>,
      default: () => [],
    },
  },
  emits: {
    'update:modelValue': (_modelValue: CoArtist[]) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const modelValue$$q = useVModel(props, 'modelValue', emit);

    const roleOptions$$q = computedEager(() =>
      builtinCoArtistRoles.map((role) => ({
        label: t(`coArtist.role.${role}`),
        value: role,
      }))
    );

    return {
      t,
      modelValue$$q,
      roleOptions$$q,
      remove$$q: (index: number): void => {
        // NOTE: calling .splice directly on the modelValue$$q.value array makes a null value in the array (I don't know why)
        const temp = Array.from(modelValue$$q.value);
        temp.splice(index, 1);
        modelValue$$q.value = temp;
      },
      roleToText$$q: roleToText,
    };
  },
});
</script>

<template>
  <div class="flex flex-col gap-y-4">
    <template v-for="(item, index) in modelValue$$q" :key="index">
      <div class="flex items-center gap-x-2">
        <div class="w-32">
          <!-- TODO: migrate to v-combobox -->
          <NSelect
            :options="roleOptions$$q"
            :value="item[0]"
            @update:value="modelValue$$q[index][0] = $event"
          />
        </div>
        <SComboboxArtist
          class="flex-1"
          create
          :label="roleToText$$q(item[0], t)"
          :artist-id="item[1]"
          :model-value="item[2]"
          @update:artist-id="modelValue$$q[index][1] = $event"
          @update:model-value="modelValue$$q[index][2] = $event"
        />
        <div>
          <VBtn
            icon
            flat
            text
            size="18"
            class="bg-transparent text-st-error"
            @click="remove$$q(index)"
          >
            <VIcon class="s-hover-visible" icon="mdi-close" />
          </VBtn>
        </div>
      </div>
    </template>
    <div>
      <VBtn
        icon
        flat
        text
        size="18"
        class="bg-transparent text-st-primary"
        @click="modelValue$$q.push(['#composer', undefined, ''])"
      >
        <VIcon class="s-hover-visible" icon="mdi-plus" />
      </VBtn>
    </div>
  </div>
</template>
