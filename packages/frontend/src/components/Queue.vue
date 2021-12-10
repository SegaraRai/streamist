<script lang="ts">
import { minQueueSize } from '@/config/queue';
import { getDefaultAlbumImage } from '@/logic/albumImage';
import { formatTime } from '@/logic/formatTime';
import { usePlaybackStore } from '@/stores/playback';
import type { ImageWithFile } from '@/types/image';
import type { TrackForPlayback } from '@/types/playback';
import type { Album, Artist } from '$prisma/client';

interface ListItem {
  album$$q: Album;
  albumArtist$$q: Artist;
  artist$$q: Artist;
  formattedDuration$$q: string;
  image$$q: ImageWithFile | undefined;
  track$$q: TrackForPlayback;
}

export default defineComponent({
  setup() {
    const { t } = useI18n();

    const playbackStore = usePlaybackStore();

    const items = computed<ListItem[]>(() =>
      playbackStore.queue$$q.value
        .slice(0, minQueueSize)
        .map((track): ListItem => {
          const album = track.album;
          const artist = track.artist;
          const albumArtist = album.artist;
          return {
            album$$q: album,
            albumArtist$$q: albumArtist,
            artist$$q: artist,
            formattedDuration$$q: formatTime(track.duration),
            image$$q: getDefaultAlbumImage(album),
            track$$q: track,
          };
        })
    );

    const currentPlayingTrackId = computed(() => {
      return playbackStore.currentTrack$$q.value?.id;
    });

    return {
      t,
      imageSize$$q: 32,
      playing$$q: playbackStore.playing$$q,
      items$$q: items,
      currentPlayingTrackId$$q: currentPlayingTrackId,
      play$$q: (index: number): void => {
        playbackStore.skipNext$$q.value(index + 1);
      },
      startMarquee$$q(event: MouseEvent): void {
        const target = (
          event.target as HTMLElement | null
        )?.getElementsByClassName('marquee-target')[0] as
          | HTMLElement
          | undefined;
        if (target && !target.classList.contains('marquee-active')) {
          const parent = target.parentElement;
          if (parent) {
            const parentWidth = parent.offsetWidth;
            const targetWidth = target.offsetWidth;
            if (targetWidth > parentWidth) {
              const totalWidth = targetWidth + parentWidth + 20;

              const startTime = Date.now() + 750;
              let isFirst = true;
              const animateFunction = (): void => {
                // finish
                if (target.classList.contains('marquee-finish')) {
                  parent.style.textOverflow = '';
                  target.style.marginLeft = '';
                  target.classList.remove('marquee-active', 'marquee-finish');
                  return;
                }

                // animate
                const elapsed = Date.now() - startTime;
                if (elapsed > 0) {
                  const x = (elapsed * 0.05 + parentWidth) % totalWidth;
                  target.style.marginLeft = `${parentWidth - x}px`;

                  if (isFirst) {
                    // TODO: ブラウザがサポートしたらfadeを用いる
                    parent.style.textOverflow = 'clip';
                    isFirst = false;
                  }
                }

                // next call
                if (window.requestAnimationFrame) {
                  window.requestAnimationFrame(animateFunction);
                } else {
                  setTimeout(animateFunction, 20);
                }
              };

              target.classList.add('marquee-active');
              animateFunction();
            }
          }
        }
      },
      finishMarquee$$q(event: MouseEvent): void {
        const target = (
          event.target as HTMLElement | null
        )?.getElementsByClassName('marquee-target')[0] as
          | HTMLElement
          | undefined;
        if (target && target.classList.contains('marquee-active')) {
          target.classList.add('marquee-finish');
        }
      },
    };
  },
});
</script>

<template>
  <div>
    <div class="queue-header">
      <v-sheet tile class="queue-header-sheet">
        <div class="px-2 py-1 title">
          <v-icon>mdi-playlist-play</v-icon>
          <span class="pl-2">{{ t('queue/Play Queue') }}</span>
        </div>
        <v-divider />
      </v-sheet>
    </div>
    <v-list flat dense>
      <v-list-item-group>
        <template v-for="(item, index) in items$$q" :key="index">
          <template v-if="index !== 0">
            <v-divider />
          </template>
          <v-list-item class="hover-container">
            <div class="list-column-icon">
              <div class="icon-container">
                <v-btn icon text @click.stop="play$$q(index)">
                  <!-- div class="track-index numeric hover-hidden">{{ index + 1 }}</div -->
                  <nullable-image
                    class="hover-hidden"
                    :image="item.image$$q"
                    :width="imageSize$$q"
                    :height="imageSize$$q"
                    :aspect-ratio="1"
                  />
                  <v-icon class="play-icon hover-display">
                    mdi-play-circle-outline
                  </v-icon>
                </v-btn>
              </div>
            </div>
            <v-list-item-content
              two-line
              class="list-column-content d-flex flex-row"
            >
              <v-list-item-title
                class="track-title"
                @mouseenter="startMarquee$$q"
                @mouseleave="finishMarquee$$q"
              >
                <v-tooltip bottom>
                  <template #activator="{ on }">
                    <span class="marquee-target" v-on="on">
                      {{ item.track$$q.title }}
                    </span>
                  </template>
                  <span>{{ item.track$$q.title }}</span>
                </v-tooltip>
              </v-list-item-title>
              <v-list-item-subtitle
                class="track-artist"
                @mouseenter="startMarquee$$q"
                @mouseleave="finishMarquee$$q"
              >
                <v-tooltip bottom>
                  <template #activator="{ on }">
                    <span class="marquee-target" v-on="on">
                      <router-link :to="`/artists/${item.artist$$q.id}`">
                        {{ item.artist$$q.name }}
                      </router-link>
                    </span>
                  </template>
                  <span>{{ item.artist$$q.name }}</span>
                </v-tooltip>
              </v-list-item-subtitle>
            </v-list-item-content>
            <div class="list-column-duration numeric body-2 pl-4">
              {{ item.formattedDuration$$q }}
            </div>
          </v-list-item>
        </template>
      </v-list-item-group>
    </v-list>
  </div>
</template>

<style scoped>
.numeric {
  font-family: 'Open Sans', monospace !important;
  font-variant-numeric: slashed-zero lining-nums tabular-nums;
  line-height: 1 !important;
  white-space: nowrap;
  user-select: none;
}

.hover-container:not(:hover) .hover-display {
  display: none;
}

.hover-container:hover .hover-hidden {
  display: none;
}

.queue-header {
  position: sticky;
  top: 0;
  z-index: 1;
}

.queue-header-sheet {
  position: relative;
  left: 1px;
}

.queue-header-sheet.theme--dark {
  background-color: #363636 !important;
}

.list-column-icon {
  width: 40px;
  margin-right: 10px;
  text-align: center;
}

.track-title {
  font-size: 0.875rem !important;
}

.track-artist {
  font-size: 0.75rem !important;
}

.play-icon {
  font-size: 32px !important;
  transition: font-size 0s;
  opacity: 0.7;
}

.play-icon:hover {
  font-size: 36px !important;
  opacity: initial;
}
</style>
