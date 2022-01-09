<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import { parseDate } from '$shared/parseDate';
import type { ResourceTrack } from '$/types';
import { useTranslatedTimeAgo } from '~/composables/timeAgo';
import { useSyncDB } from '~/db/sync';
import api from '~/logic/api';
import {
  convertOptId,
  convertOptNum,
  convertOptStr,
  convertReqNum,
  convertReqStr,
  createIntegerRef,
} from '~/logic/editUtils';
import { setRedirect } from '~/stores/redirect';

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
    const { t } = useI18n();
    const message = useMessage();
    const syncDB = useSyncDB();

    const dialog$$q = useVModel(props, 'modelValue', emit);

    const trackId$$q = ref('');
    const albumId$$q = ref<string | undefined>();
    const albumTitle$$q = ref('');
    const artistId$$q = ref<string | undefined>();
    const artistName$$q = ref('');
    const itemTitle$$q = ref('');
    const itemTitleSort$$q = ref('');
    const itemTrackNumber$$q = createIntegerRef();
    const itemDiscNumber$$q = createIntegerRef();
    const itemReleaseDateText$$q = ref('');
    const itemGenre$$q = ref('');
    const itemBPM$$q = createIntegerRef();
    const itemComment$$q = ref('');
    const itemLyrics$$q = ref('');

    const reloadData = (newTrack: ResourceTrack): void => {
      trackId$$q.value = newTrack.id;
      albumId$$q.value = newTrack.albumId;
      albumTitle$$q.value = '';
      artistId$$q.value = newTrack.artistId;
      artistName$$q.value = '';
      itemTitle$$q.value = newTrack.title;
      itemTitleSort$$q.value = newTrack.titleSort || '';
      itemDiscNumber$$q.value = newTrack.discNumber;
      itemTrackNumber$$q.value = newTrack.trackNumber;
      itemReleaseDateText$$q.value = newTrack.releaseDateText || '';
      itemGenre$$q.value = newTrack.genre || '';
      itemBPM$$q.value = newTrack.bpm ?? undefined;
      itemComment$$q.value = newTrack.comment || '';
      itemLyrics$$q.value = newTrack.lyrics || '';
    };

    watch(
      eagerComputed(() => props.track),
      reloadData,
      {
        immediate: true,
      }
    );

    watch(dialog$$q, (newDialog, oldDialog) => {
      if (!newDialog && oldDialog) {
        reloadData(props.track);
      }
    });

    const isAlbumEmpty$$q = eagerComputed(
      () => !albumId$$q.value && !albumTitle$$q.value
    );

    const isArtistEmpty$$q = eagerComputed(
      () => !artistId$$q.value && !artistName$$q.value
    );

    const parsedReleaseDate$$q = eagerComputed(() =>
      itemReleaseDateText$$q.value
        ? parseDate(itemReleaseDateText$$q.value)
        : undefined
    );
    const releaseDateWarning$$q = eagerComputed(
      () => !!itemReleaseDateText$$q.value && !parsedReleaseDate$$q.value
    );
    const releaseDateHint$$q = eagerComputed(() => {
      if (releaseDateWarning$$q.value) {
        return t('dialogComponent.editTrack.releaseDate.invalid');
      }

      const parsed = parsedReleaseDate$$q.value;
      if (!parsed) {
        return;
      }

      // TODO: localization
      const dateString = parsed.dateString$$q;
      switch (parsed.precision$$q) {
        case 'year':
          return t('dialogComponent.editTrack.releaseDate.hint', [
            dateString.slice(0, 4),
          ]);

        case 'month':
          return t('dialogComponent.editTrack.releaseDate.hint', [
            dateString.slice(0, 7),
          ]);

        case 'day':
          return t('dialogComponent.editTrack.releaseDate.hint', [dateString]);
      }
    });

    const modified$$q = eagerComputed(
      () =>
        (itemTitle$$q.value && itemTitle$$q.value !== props.track.title) ||
        (itemTitleSort$$q.value || null) !== props.track.titleSort ||
        (itemDiscNumber$$q.value != null &&
          itemDiscNumber$$q.value !== props.track.discNumber) ||
        (itemTrackNumber$$q.value != null &&
          itemTrackNumber$$q.value !== props.track.trackNumber) ||
        (itemReleaseDateText$$q.value || null) !==
          props.track.releaseDateText ||
        (itemGenre$$q.value || null) !== props.track.genre ||
        (itemBPM$$q.value ?? null) !== props.track.bpm ||
        (itemComment$$q.value || null) !== props.track.comment ||
        ((itemLyrics$$q.value || null) &&
          itemLyrics$$q.value !== props.track.lyrics) ||
        (!isAlbumEmpty$$q.value && albumId$$q.value !== props.track.albumId) ||
        (!isArtistEmpty$$q.value && artistId$$q.value !== props.track.artistId)
    );

    return {
      t,
      imageIds$$q: ref<readonly string[] | undefined>(),
      dialog$$q,
      isAlbumEmpty$$q,
      albumId$$q,
      albumName$$q: albumTitle$$q,
      isArtistEmpty$$q,
      artistId$$q,
      artistName$$q,
      parsedReleaseDate$$q,
      releaseDateHint$$q,
      releaseDateWarning$$q,
      itemTitle$$q,
      itemTitleSort$$q,
      itemDiscNumber$$q,
      itemTrackNumber$$q,
      itemReleaseDateText$$q,
      itemGenre$$q,
      itemBPM$$q,
      itemComment$$q,
      itemLyrics$$q,
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

        const oldAlbumId = track.albumId;
        const oldArtistId = track.artistId;

        api.my.tracks
          ._trackId(trackId)
          .$patch({
            body: {
              title: convertReqStr(itemTitle$$q.value, track.title),
              titleSort: convertOptStr(itemTitleSort$$q.value, track.titleSort),
              trackNumber: convertReqNum(
                itemTrackNumber$$q.value,
                track.trackNumber
              ),
              discNumber: convertReqNum(
                itemDiscNumber$$q.value,
                track.discNumber
              ),
              releaseDateText: convertOptStr(
                itemReleaseDateText$$q.value,
                track.releaseDateText
              ),
              genre: convertOptStr(itemGenre$$q.value, track.genre),
              bpm: convertOptNum(itemBPM$$q.value, track.bpm),
              comment: convertOptStr(itemComment$$q.value, track.comment),
              lyrics: convertOptStr(itemLyrics$$q.value, track.lyrics),
              albumId: convertOptId(albumId$$q.value, track.albumId),
              albumTitle: albumId$$q.value
                ? undefined
                : albumTitle$$q.value.trim(),
              artistId: convertOptId(artistId$$q.value, track.artistId),
              artistName: artistId$$q.value
                ? undefined
                : artistName$$q.value.trim(),
            },
          })
          .then((newTrack) => {
            // NOTE: 本当はアルバムアーティストもチェックしないといけない
            // NOTE: 実際にはリダイレクトが正しくない場合もあるが、見つからない場合だけ行われるため別に良い
            if (newTrack.albumId !== oldAlbumId) {
              setRedirect(
                `/albums/${oldAlbumId}`,
                `/albums/${newTrack.albumId}`
              );
            }
            if (newTrack.artistId !== oldArtistId) {
              setRedirect(
                `/artists/${oldArtistId}`,
                `/artists/${newTrack.artistId}`
              );
            }
            dialog$$q.value = false;
            message.success(t('message.ModifiedTrack', [itemTitle$$q.value]));
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToModifyTrack', [track.title, String(error)])
            );
          });
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
        <div class="flex-1 line-clamp-2 overflow-hidden">
          {{ t('dialogComponent.editTrack.title', [track.title]) }}
        </div>
        <div class="flex-none">
          <v-btn
            flat
            icon
            size="x-small"
            class="text-st-error"
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
                v-model="itemTitle$$q"
                hide-details
                class="flex-1 s-v-input-hide-details"
                :label="t('dialogComponent.editTrack.label.Title')"
                required
              />
              <v-text-field
                v-model="itemTitleSort$$q"
                hide-details
                class="flex-1 s-v-input-hide-details"
                :label="t('dialogComponent.editTrack.label.TitleSort')"
              />
            </div>
            <s-combobox-artist
              v-model="artistName$$q"
              v-model:artistId="artistId$$q"
              :label="t('dialogComponent.editTrack.label.Artist')"
            />
            <s-combobox-album
              v-model="albumName$$q"
              v-model:albumId="albumId$$q"
              :label="t('dialogComponent.editTrack.label.Album')"
            />
            <n-collapse>
              <n-collapse-item title="More">
                <div class="flex flex-col gap-y-6">
                  <div class="flex gap-6 flex-col sm:flex-row">
                    <div class="flex-1 flex-grow-[2] flex gap-6">
                      <v-text-field
                        v-model="itemTrackNumber$$q"
                        hide-details
                        type="number"
                        min="1"
                        class="s-v-input-hide-details !flex-1"
                        :label="
                          t('dialogComponent.editTrack.label.TrackNumber')
                        "
                      />
                      <v-text-field
                        v-model="itemDiscNumber$$q"
                        hide-details
                        type="number"
                        min="1"
                        class="s-v-input-hide-details !flex-1"
                        :label="t('dialogComponent.editTrack.label.DiscNumber')"
                      />
                    </div>
                    <v-text-field
                      v-model="itemReleaseDateText$$q"
                      hide-details
                      class="s-v-input-hide-details !flex-1"
                      :label="t('dialogComponent.editTrack.label.ReleaseDate')"
                      :hint="releaseDateHint$$q"
                      :title="releaseDateHint$$q"
                      :color="releaseDateWarning$$q ? 'warning' : undefined"
                      :error="releaseDateWarning$$q"
                      persistent-hint
                    />
                  </div>
                  <div class="flex gap-x-6">
                    <v-text-field
                      v-model="itemGenre$$q"
                      hide-details
                      class="s-v-input-hide-details !flex-1"
                      :label="t('dialogComponent.editTrack.label.Genre')"
                    />
                    <v-text-field
                      v-model="itemBPM$$q"
                      hide-details
                      type="number"
                      min="1"
                      class="s-v-input-hide-details !flex-1"
                      :label="t('dialogComponent.editTrack.label.BPM')"
                    />
                  </div>
                  <v-text-field
                    v-model="itemComment$$q"
                    hide-details
                    class="s-v-input-hide-details"
                    :label="t('dialogComponent.editTrack.label.Comment')"
                  />
                  <v-textarea
                    v-model="itemLyrics$$q"
                    hide-details
                    class="s-v-input-hide-details"
                    :label="t('dialogComponent.editTrack.label.Lyrics')"
                  />
                  <footer class="flex m-0 gap-x-4 justify-end">
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
              </n-collapse-item>
            </n-collapse>
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="gap-x-4 pb-4 px-4">
        <v-spacer />
        <v-btn @click="dialog$$q = false">
          {{ t('dialogComponent.editTrack.button.Cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="isAlbumEmpty$$q || isArtistEmpty$$q || !modified$$q"
          @click="apply$$q"
        >
          {{ t('dialogComponent.editTrack.button.OK') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </n-modal>
</template>
