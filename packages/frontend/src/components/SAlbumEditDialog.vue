<script lang="ts">
import type { PropType } from 'vue';
import { useDisplay } from 'vuetify';
import type { ResourceAlbum } from '$/types';

export default defineComponent({
  props: {
    album: {
      type: Object as PropType<ResourceAlbum>,
      required: true,
    },
    modelValue: Boolean,
  },
  emits: {
    'update:modelValue': (_modelValue: boolean) => true,
  },
  setup(props, { emit }) {
    const dialog$$q = useVModel(props, 'modelValue', emit);
    const display = useDisplay();

    return {
      dialog$$q,
      fullscreen$$q: eagerComputed(() => display.smAndDown.value),
    };
  },
});
</script>

<template>
  <v-dialog v-model="dialog$$q" class="select-none" :fullscreen="fullscreen$$q">
    <v-card class="w-full">
      <v-card-title class="flex">
        <div class="flex-1">Edit {{ album.title }}</div>
        <div class="flex-none">
          <v-btn
            flat
            icon
            size="x-small"
            class="text-red-500"
            @click="dialog$$q = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>
      <v-card-text class="opacity-100">
        <v-form>
          <v-text-field label="Title" required />

          <v-btn
            :disabled="!valid"
            color="success"
            class="mr-4"
            @click="validate"
          >
            Validate
          </v-btn>

          <v-btn color="error" class="mr-4" @click="reset"> Reset Form </v-btn>

          <v-btn color="warning" @click="resetValidation">
            Reset Validation
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
