<script lang="ts">
export default defineComponent({
  setup() {
    const w = ref(72);
    const h = ref(140);
    const h2 = ref(28);
    const r = ref(30);
    const path = computed(() => {
      const wv = Number(w.value);
      const hv = Number(h.value);
      const h2v = Number(h2.value);
      return `M 128 ${128 - hv} L 128 ${128 - h2v} L ${128 + wv} ${
        128 - h2v
      } L 128 ${128 + hv} L 128 ${128 + h2v} L ${128 - wv} ${128 + h2v} Z`;
    });
    const rotatedPath = computed(() => {
      const rad = (r.value * Math.PI) / 180;
      return path.value
        .replace(/(-?\d+) (-?\d+)/g, (_, sx, sy) => {
          const x = parseInt(sx, 10) - 128;
          const y = parseInt(sy, 10) - 128;
          const theta = Math.atan2(y, x);
          const r = Math.sqrt(x * x + y * y);
          const rx = Math.cos(theta + rad) * r + 128;
          const ry = Math.sin(theta + rad) * r + 128;
          return `${rx.toFixed(4)} ${ry.toFixed(4)}`;
        })
        .replace(/\.0+ /g, ' ')
        .replace(/(\.[1-9]+)0+ /g, '$1 ');
    });
    const text = computed(
      () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <path
          fill="#2a8dfe"
          stroke="#f00"
          stroke-width="0"
          d="${rotatedPath.value}"
        />
      </svg>`
    );
    const favicon = computed(
      () => `data:image/svg+xml,${encodeURIComponent(text.value)}`
    );
    useFavicon(favicon);
    const element = ref<string | null>(null);
    setTimeout(() => {
      element.value = '#logo';
    }, 1000);

    return {
      w,
      h,
      h2,
      r,
      rotatedPath,
      element,
    };
  },
});
</script>

<template>
  <v-container fluid>
    <header class="mb-6 flex items-baseline gap-x-4">
      <div class="text-h5">Resources</div>
    </header>
    <div>
      <div>This is a debug page.</div>
      <ul class="text-st-info">
        <li>
          <router-link to="/resources/tracks">Tracks</router-link>
        </li>
        <li>
          <router-link to="/resources/albums">Albums</router-link>
        </li>
        <li>
          <router-link to="/resources/artists">Artists</router-link>
        </li>
        <li>
          <router-link to="/resources/playlists">Playlists</router-link>
        </li>
        <li>
          <router-link to="/resources/sources">Sources</router-link>
        </li>
      </ul>
    </div>
    <div>
      <input v-model="w" type="number" />
      <input v-model="h" type="number" />
      <input v-model="h2" type="number" />
      <input v-model="r" type="number" />
      <svg viewBox="0 0 256 256" width="256" height="256">
        <path fill="#fff" stroke="#f00" stroke-width="0" :d="rotatedPath" />
      </svg>
      <template v-if="element">
        <teleport to="#logo">
          <svg viewBox="0 0 256 256" class="w-7 h-7">
            <path
              fill="#2a8dfe"
              stroke="#f00"
              stroke-width="0"
              :d="rotatedPath"
            />
          </svg>
        </teleport>
      </template>
    </div>
  </v-container>
</template>
