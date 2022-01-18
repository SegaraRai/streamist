<script lang="ts">
import type { PropType } from 'vue';
import { filterNullAndUndefined } from '$shared/filter';
import { createMultiMap } from '$shared/multiMap';
import { toUnique } from '$shared/unique';
import { compareCoArtist } from '$/shared/sort';
import type { ResourceTrack } from '$/types';
import { useLiveQuery } from '~/composables';
import { db } from '~/db';
import { formatTime } from '~/logic/formatTime';
import { roleToText } from '~/logic/role';

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

    const dialog$$q = useVModel(props, 'modelValue', emit);

    const propTrackRef = eagerComputed(() => props.track);
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
        const trackId = track$$q.id;
        const album$$q = await db.albums.get(track$$q.albumId);
        if (!album$$q) {
          throw new Error(
            `Album ${track$$q.albumId} not found. (database corrupted)`
          );
        }
        const artist$$q = await db.artists.get(track$$q.artistId);
        if (!artist$$q) {
          throw new Error(
            `Artist ${track$$q.artistId} not found. (database corrupted)`
          );
        }
        const albumArtist$$q = await db.artists.get(album$$q.artistId);
        if (!albumArtist$$q) {
          throw new Error(
            `Artist ${album$$q.artistId} not found. (database corrupted)`
          );
        }
        const coArtist = await db.trackCoArtists.where({ trackId }).toArray();
        coArtist.sort(compareCoArtist);
        const artistMap = new Map(
          filterNullAndUndefined(
            await db.artists.bulkGet(
              toUnique(coArtist.map((coArtist) => coArtist.artistId))
            )
          ).map((artist) => [artist.id, artist])
        );
        const groupedCoArtists$$q = [
          [
            null,
            [
              {
                role: null,
                artistId: artist$$q.id,
                artist: artist$$q,
              },
            ],
          ] as const,
          ...createMultiMap(
            coArtist.map((coArtist) => ({
              ...coArtist,
              artist: artistMap.get(coArtist.artistId),
            })),
            'role'
          ).entries(),
        ];
        if (propTrackRef.value !== propTrack) {
          throw new Error('operation aborted');
        }
        return {
          track$$q,
          album$$q,
          artist$$q,
          albumArtist$$q,
          groupedCoArtists$$q,
        };
      },
      [propTrackRef],
      true
    );

    return {
      t,
      dialog$$q,
      value$$q: value,
      roleToText$$q: roleToText,
      formatTime$$q: formatTime,
    };
  },
});
</script>

<template>
  <template v-if="value$$q">
    <n-modal
      v-model:show="dialog$$q"
      transform-origin="center"
      class="select-none max-w-3xl"
    >
      <v-card class="w-full md:min-w-2xl">
        <v-card-title class="flex">
          <div class="flex-1 line-clamp-2 overflow-hidden">
            {{
              t('dialogComponent.trackDetails.title', [value$$q.track$$q.title])
            }}
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
            <div class="<sm:w-full text-center leading-none">
              <s-album-image
                class="w-40 h-40"
                size="160"
                :album="value$$q.album$$q"
              />
            </div>
            <div
              class="flex-1 flex flex-col gap-y-4 select-text overflow-hidden"
            >
              <div class="flex-1 flex flex-col">
                <div class="flex flex-col leading-tight gap-y-1">
                  <div
                    class="flex items-center gap-x-3 opacity-60 font-medium select-none"
                  >
                    <div class="flex items-center gap-x-2.5">
                      <div class="flex items-center">
                        <i-mdi-disc />
                        <span class="s-numeric">
                          {{ value$$q.track$$q.discNumber }}
                        </span>
                      </div>
                      <div class="flex items-center">
                        <i-mdi-playlist-music />
                        <span class="s-numeric">
                          {{ value$$q.track$$q.trackNumber }}
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center gap-x-0.5">
                      <i-mdi-clock-outline />
                      <span class="s-duration">
                        {{ formatTime$$q(value$$q.track$$q.duration) }}
                      </span>
                    </div>
                    <template v-if="value$$q.track$$q.releaseDateText">
                      <div class="flex items-center gap-x-0.5">
                        <i-mdi-calendar-outline />
                        <span class="s-numeric">
                          {{ value$$q.track$$q.releaseDateText }}
                        </span>
                      </div>
                    </template>
                    <template v-if="value$$q.track$$q.genre">
                      <div class="flex items-center gap-x-0.5">
                        <i-mdi-file-music />
                        <span class="s-numeric">
                          {{ value$$q.track$$q.genre }}
                        </span>
                      </div>
                    </template>
                    <template v-if="value$$q.track$$q.bpm">
                      <div class="flex items-center">
                        <i-mdi-music-note-quarter />
                        <span class="s-numeric">
                          {{ value$$q.track$$q.bpm }} BPM
                        </span>
                      </div>
                    </template>
                  </div>
                  <div
                    class="text-2xl leading-tight"
                    :title="value$$q.track$$q.titleSort || undefined"
                  >
                    {{ value$$q.track$$q.title }}
                  </div>
                </div>
                <div>
                  <router-link
                    class="light:font-medium opacity-60 leading-tight"
                    :to="`/albums/${value$$q.track$$q.albumId}`"
                  >
                    {{ value$$q.album$$q.title }}
                  </router-link>
                </div>
              </div>
              <dl class="flex-1 flex flex-col gap-y-4">
                <template
                  v-for="[role, coArtists] in value$$q.groupedCoArtists$$q"
                  :key="role"
                >
                  <div class="flex flex-col gap-y-0.5">
                    <dt class="text-xs light:font-medium opacity-60">
                      {{
                        role
                          ? roleToText$$q(
                              role,
                              t,
                              'coArtist.n_role.',
                              coArtists.length
                            )
                          : t('dialogComponent.trackDetails.artist')
                      }}
                    </dt>
                    <dd class="flex flex-col gap-y-1">
                      <template
                        v-for="coArtist in coArtists"
                        :key="coArtist.artistId"
                      >
                        <div class="flex items-center gap-x-2">
                          <router-link
                            class="inline-flex items-center gap-x-1 max-w-full"
                            :to="`/artists/${coArtist.artistId}`"
                          >
                            <s-artist-image
                              class="flex-none w-6 h-6"
                              :artist="coArtist.artistId"
                            />
                            <div
                              class="flex-shrink-1 leading-tight whitespace-nowrap overflow-hidden overflow-ellipsis"
                            >
                              {{ coArtist.artist?.name }}
                            </div>
                          </router-link>
                        </div>
                      </template>
                    </dd>
                  </div>
                </template>
              </dl>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </n-modal>
  </template>
</template>
