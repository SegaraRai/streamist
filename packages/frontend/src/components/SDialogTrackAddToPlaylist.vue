<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import { comparePlaylist } from '$/shared/sort';
import type { ResourcePlaylist, ResourceTrack } from '$/types';
import { useLiveQuery } from '~/composables';
import { db, useSyncDB } from '~/db';
import { api } from '~/logic/api';

export default defineComponent({
  props: {
    track: {
      type: [String, Object] as PropType<string | ResourceTrack>,
      required: true,
    },
    modelValue: Boolean,
  },
  emits: {
    'update:modelValue': (_modelValue: boolean) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const message = useMessage();
    const syncDB = useSyncDB();

    const dialog$$q = useVModel(props, 'modelValue', emit);

    const propTrackRef = computedEager(() => props.track);
    const { value } = useLiveQuery(
      async () => {
        const propTrack = propTrackRef.value;
        const track$$q =
          typeof propTrack === 'string'
            ? await db.tracks.get(propTrack)
            : propTrack;
        if (!track$$q) {
          throw new Error(`Track ${propTrack} not found`);
        }
        const playlists = (await db.playlists.toArray()).sort(comparePlaylist);
        const playlists$$q = playlists.map((playlist) => ({
          item$$q: playlist,
          available$$q: !playlist.trackIds.includes(track$$q.id),
        }));
        if (propTrackRef.value !== propTrack) {
          throw new Error('operation aborted');
        }
        return {
          track$$q,
          playlists$$q,
        };
      },
      [propTrackRef],
      true
    );

    return {
      t,
      dialog$$q,
      value$$q: value,
      createNew$$q: (): void => {
        const track = value.value?.track$$q;
        if (!track) {
          return;
        }

        dialog$$q.value = false;

        api.my.playlists
          .$post({
            body: {
              title: track.title,
              description: '',
              trackIds: [track.id],
            },
          })
          .then(() => {
            message.success(t('message.CreatedPlaylist', [track.title]));
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToCreatePlaylist', [track.title, String(error)])
            );
          });
      },
      select$$q: (playlist: ResourcePlaylist): void => {
        const track = value.value?.track$$q;
        if (!track) {
          return;
        }

        dialog$$q.value = false;

        api.my.playlists
          ._playlistId(playlist.id)
          .tracks.$post({
            body: {
              trackIds: [track.id],
            },
          })
          .then(() => {
            message.success(
              t('message.AddedToPlaylist', [playlist.title, track.title])
            );
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToAddToPlaylist', [
                playlist.title,
                track.title,
                String(error),
              ])
            );
          });
      },
    };
  },
});
</script>

<template>
  <template v-if="value$$q">
    <NModal
      v-model:show="dialog$$q"
      transform-origin="center"
      class="select-none max-w-3xl"
    >
      <VCard class="w-full md:min-w-2xl">
        <VCardTitle class="flex">
          <div class="s-dialog-title">
            {{
              t('dialogComponent.trackAddToPlaylist.title', [
                value$$q.track$$q.title,
              ])
            }}
          </div>
          <div class="flex-none">
            <VBtn
              flat
              icon
              size="x-small"
              class="text-st-error"
              @click="dialog$$q = false"
            >
              <VIcon>mdi-close</VIcon>
            </VBtn>
          </div>
        </VCardTitle>
        <VCardText class="opacity-100">
          <div>
            <template v-if="value$$q.playlists$$q.length">
              <VList class="max-h-70 mb-6" flat @contextmenu.prevent>
                <template v-for="item in value$$q.playlists$$q" :key="item.id">
                  <VListItem
                    v-ripple="item.available$$q"
                    class="flex gap-x-4 s-hover-container rounded-4px cursor-pointer"
                    :class="item.available$$q ? 'opacity-100' : 'opacity-60'"
                    :disabled="!item.available$$q"
                    @click="select$$q(item.item$$q)"
                  >
                    <SPlaylistImage
                      class="flex-none w-9 h-9"
                      size="36"
                      :playlist="item.item$$q"
                    />
                    <VListItemHeader class="flex-1">
                      <VListItemTitle class="s-heading-sl">
                        {{ item.item$$q.title }}
                      </VListItemTitle>
                      <VListItemSubtitle class="s-subheading-sl text-xs">
                        <span>
                          {{
                            t(
                              'playlists.n_tracks',
                              item.item$$q.trackIds.length
                            )
                          }}
                        </span>
                      </VListItemSubtitle>
                    </VListItemHeader>
                  </VListItem>
                </template>
              </VList>
            </template>
            <div class="flex justify-end">
              <VBtn color="primary" variant="outlined" @click="createNew$$q">
                {{ t('dialogComponent.trackAddToPlaylist.AddToNewPlaylist') }}
              </VBtn>
            </div>
          </div>
        </VCardText>
      </VCard>
    </NModal>
  </template>
</template>
