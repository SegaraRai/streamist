<script lang="ts">
import { minQueueSize } from '~/config/queue';
import { db } from '~/db';
import { formatTime } from '~/logic/formatTime';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { usePlaybackStore } from '~/stores/playback';
import type { ResourceArtist, ResourceTrack } from '$/types';

interface ListItem {
  formattedDuration$$q: string;
  artist$$q: ResourceArtist;
  track$$q: ResourceTrack;
}

export default defineComponent({
  setup() {
    const playbackStore = usePlaybackStore();

    const { value: temp } = useLiveQuery<
      [readonly ListItem[], readonly ListItem[]]
    >(async () => {
      const playNextQueue = playbackStore.playNextQueue$$q.value;
      const queue = playbackStore.queue$$q.value.slice(0, minQueueSize);
      const artistMap = new Map<string, ResourceArtist>(
        (
          await db.artists.bulkGet(
            Array.from(
              new Set(
                [...playNextQueue, ...queue].map((track) => track.artistId)
              )
            )
          )
        ).map((artist) => [artist!.id, artist!])
      );
      const transformTrack = (track: ResourceTrack): ListItem => ({
        formattedDuration$$q: formatTime(track.duration),
        track$$q: track,
        artist$$q: artistMap.get(track.artistId)!,
      });
      return [playNextQueue.map(transformTrack), queue.map(transformTrack)];
    }, [playbackStore.playNextQueue$$q, playbackStore.queue$$q]);

    return {
      repeatOne$$q: computed(() => playbackStore.repeat$$q.value === 'one'),
      playNextItems$$q: computed(() => temp.value?.[0] || []),
      items$$q: computed(() => temp.value?.[1] || []),
      play$$q: (index: number): void => {
        playbackStore.skipNext$$q(index + 1);
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
  <v-list flat dense :class="repeatOne$$q ? 'opacity-50' : ''">
    <template v-for="(item, index) in playNextItems$$q" :key="index">
      <template v-if="index !== 0">
        <v-divider />
      </template>
      <v-list-item class="s-hover-container">
        <div class="list-column-icon">
          <div class="icon-container">
            <v-btn flat icon text @click.stop="play$$q(index)">
              <!-- div class="track-index s-numeric s-hover-hidden">{{ index + 1 }}</div -->
              <s-album-image
                class="s-hover-hidden flex-none w-9 h-9"
                size="36"
                :album="item.track$$q.albumId"
              />
              <v-icon class="play-icon s-hover-visible">
                mdi-play-circle-outline
              </v-icon>
            </v-btn>
          </div>
        </div>
        <v-list-item-header two-line class="list-column-content flex flex-col">
          <v-list-item-title
            class="track-title whitespace-nowrap overflow-hidden"
            @mouseenter="startMarquee$$q"
            @mouseleave="finishMarquee$$q"
          >
            <v-tooltip bottom>
              <template #activator>
                <span class="marquee-target">
                  <router-link :to="`/albums/${item.track$$q.albumId}`">
                    {{ item.track$$q.title }}
                  </router-link>
                </span>
              </template>
              <span>{{ item.track$$q.title }}</span>
            </v-tooltip>
          </v-list-item-title>
          <v-list-item-subtitle
            class="track-artist whitespace-nowrap overflow-hidden"
            @mouseenter="startMarquee$$q"
            @mouseleave="finishMarquee$$q"
          >
            <v-tooltip bottom>
              <template #activator>
                <span class="marquee-target">
                  <router-link :to="`/artists/${item.artist$$q.id}`">
                    {{ item.artist$$q.name }}
                  </router-link>
                </span>
              </template>
              <span>{{ item.artist$$q.name }}</span>
            </v-tooltip>
          </v-list-item-subtitle>
        </v-list-item-header>
        <div class="list-column-duration s-duration body-2 pl-4">
          {{ item.formattedDuration$$q }}
        </div>
      </v-list-item>
    </template>
    <v-divider />
    <template v-for="(item, index) in items$$q" :key="index">
      <template v-if="index !== 0">
        <v-divider />
      </template>
      <v-list-item class="s-hover-container">
        <div class="list-column-icon">
          <div class="icon-container">
            <v-btn flat icon text @click.stop="play$$q(index)">
              <!-- div class="track-index s-numeric s-hover-hidden">{{ index + 1 }}</div -->
              <s-album-image
                class="s-hover-hidden flex-none w-9 h-9"
                size="36"
                :album="item.track$$q.albumId"
              />
              <v-icon class="play-icon s-hover-visible">
                mdi-play-circle-outline
              </v-icon>
            </v-btn>
          </div>
        </div>
        <v-list-item-header two-line class="list-column-content flex flex-col">
          <v-list-item-title
            class="track-title whitespace-nowrap overflow-hidden"
            @mouseenter="startMarquee$$q"
            @mouseleave="finishMarquee$$q"
          >
            <v-tooltip bottom>
              <template #activator>
                <span class="marquee-target">
                  <router-link :to="`/albums/${item.track$$q.albumId}`">
                    {{ item.track$$q.title }}
                  </router-link>
                </span>
              </template>
              <span>{{ item.track$$q.title }}</span>
            </v-tooltip>
          </v-list-item-title>
          <v-list-item-subtitle
            class="track-artist whitespace-nowrap overflow-hidden"
            @mouseenter="startMarquee$$q"
            @mouseleave="finishMarquee$$q"
          >
            <v-tooltip bottom>
              <template #activator>
                <span class="marquee-target">
                  <router-link :to="`/artists/${item.artist$$q.id}`">
                    {{ item.artist$$q.name }}
                  </router-link>
                </span>
              </template>
              <span>{{ item.artist$$q.name }}</span>
            </v-tooltip>
          </v-list-item-subtitle>
        </v-list-item-header>
        <div class="list-column-duration s-duration body-2 pl-4">
          {{ item.formattedDuration$$q }}
        </div>
      </v-list-item>
    </template>
  </v-list>
</template>

<style scoped>
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
