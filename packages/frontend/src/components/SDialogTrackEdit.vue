<script lang="ts">
// import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import { useDisplay } from 'vuetify';
import type { ResourceTrack } from '$/types';
import { useTranslatedTimeAgo } from '~/composables/timeAgo';
// import { useSyncDB } from '~/db/sync';
// import api from '~/logic/api';

export default defineComponent({
  props: {
    track: {
      type: Object as PropType<ResourceTrack>,
      required: true,
    },
    modelValue: Boolean,
  },
  emits: {
    'update:modelValue': (_modelValue: boolean) => true,
  },
  setup(props, { emit }) {
    // const { t } = useI18n();
    const display = useDisplay();
    // const message = useMessage();
    // const syncDB = useSyncDB();

    const dialog$$q = useVModel(props, 'modelValue', emit);

    const trackId$$q = ref('');
    const title$$q = ref('');
    const artistId$$q = ref('');
    const artistName$$q = ref('');

    watch(
      eagerComputed(() => props.track),
      (newTrack) => {
        trackId$$q.value = newTrack.id;
        title$$q.value = newTrack.title;
        artistId$$q.value = newTrack.artistId;
        artistName$$q.value = '';
      },
      {
        immediate: true,
      }
    );

    const isArtistEmpty$$q = eagerComputed(
      () => !artistId$$q.value && !artistName$$q.value
    );

    const modified$$q = eagerComputed(
      () =>
        (title$$q.value && title$$q.value !== props.track.title) ||
        (!isArtistEmpty$$q.value && artistId$$q.value !== props.track.artistId)
    );

    return {
      imageIds$$q: ref<readonly string[] | undefined>(),
      dialog$$q,
      fullscreen$$q: eagerComputed(() => display.smAndDown.value),
      title$$q,
      artistId$$q,
      artistName$$q,
      modified$$q,
      strCreatedAt$$q: useTranslatedTimeAgo(
        eagerComputed(() => props.track.createdAt)
      ),
      strUpdatedAt$$q: useTranslatedTimeAgo(
        eagerComputed(() => props.track.updatedAt)
      ),
      apply$$q: () => {
        const track = props.track;
        const trackId = trackId$$q.value;
        if (track.id !== trackId) {
          return;
        }

        console.log('todo');

        // TODO
        /*
        api.my.playlists
          ._playlistId(playlistId)
          .$patch({
            body: {
              title:
                playlist.title !== title$$q.value ? title$$q.value : undefined,
              notes:
                playlist.notes !== notes$$q.value ? notes$$q.value : undefined,
            },
          })
          .then(() => {
            dialog$$q.value = false;
            message.success(t('message.ModifiedPlaylist', [title$$q.value]));
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToModifyPlaylist', [
                title$$q.value,
                String(error),
              ])
            );
          });
        //*/
      },
    };
  },
});
</script>

<template>
  <n-modal
    v-model:show="dialog$$q"
    transform-origin="center"
    class="select-none max-w-xl"
  >
    <v-card class="w-full md:min-w-2xl">
      <v-card-title class="flex">
        <div class="flex-1">Edit {{ track.title }}</div>
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
        <div class="flex gap-x-4">
          <div class="flex-1 flex flex-col gap-y-6">
            <div class="flex gap-x-6">
              <v-text-field
                v-model="title$$q"
                hide-details
                class="flex-1 s-v-input-hide-details"
                label="Title"
                required
              />
              <v-text-field
                v-model="title$$q"
                hide-details
                class="flex-1 s-v-input-hide-details"
                label="Title sort"
              />
            </div>
            <s-artist-combobox
              v-model="artistName$$q"
              v-model:artistId="artistId$$q"
            />
            <v-text-field
              v-model="title$$q"
              hide-details
              class="s-v-input-hide-details"
              label="Album"
            />
            <n-collapse>
              <n-collapse-item title="More">
                <div class="flex flex-col gap-y-6">
                  <div class="flex gap-x-6">
                    <v-text-field
                      v-model="title$$q"
                      hide-details
                      class="s-v-input-hide-details"
                      label="Release Date"
                    />
                    <v-text-field
                      v-model="title$$q"
                      hide-details
                      class="s-v-input-hide-details"
                      label="Genre"
                    />
                    <v-text-field
                      v-model="title$$q"
                      hide-details
                      class="s-v-input-hide-details"
                      label="BPM"
                    />
                  </div>
                  <v-text-field
                    v-model="title$$q"
                    hide-details
                    class="s-v-input-hide-details"
                    label="Comment"
                  />
                  <v-textarea
                    v-model="title$$q"
                    hide-details
                    class="s-v-input-hide-details"
                    label="Lyrics"
                  />
                </div>
              </n-collapse-item>
            </n-collapse>
            <footer class="flex m-0 px-4 gap-x-4 justify-end">
              <dl class="flex gap-x-4">
                <dt>created</dt>
                <dd>{{ strCreatedAt$$q }}</dd>
              </dl>
              <div class="border-l"></div>
              <dl class="flex gap-x-4">
                <dt>last updated</dt>
                <dd>{{ strUpdatedAt$$q }}</dd>
              </dl>
            </footer>
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="gap-x-4 pb-4 px-6">
        <v-spacer />
        <v-btn @click="dialog$$q = false">Cancel</v-btn>
        <v-btn color="primary" :disabled="!modified$$q" @click="apply$$q">
          OK
        </v-btn>
      </v-card-actions>
    </v-card>
  </n-modal>
</template>
