<route lang="yaml">
meta:
  layout: app
</route>

<script lang="ts">
import {
  useAllAlbums,
  useAllArtists,
  useAllImages,
  useAllSourceFiles,
  useAllTracks,
} from '~/composables';
import { humanizeSize } from '~/logic/humanizeSize';

export default defineComponent({
  setup() {
    const { t } = useI18n();

    useHead({
      title: t('title.Usage'),
    });

    const allAlbums = useAllAlbums();
    const allArtists = useAllArtists();
    const allTracks = useAllTracks();
    const allImages = useAllImages();
    const allSourceFiles = useAllSourceFiles();

    return {
      t,
      albumCount$$q: computed(() => allAlbums.value.value?.length),
      artistCount$$q: computed(() => allArtists.value.value?.length),
      trackCount$$q: computed(() => allTracks.value.value?.length),
      trackFileCount$$q: computed(
        () => allTracks.value.value?.flatMap((track) => track.files).length
      ),
      trackFileSizeCount$$q: computed(() =>
        allTracks.value.value
          ?.flatMap((track) => track.files)
          .reduce((acc, cur) => acc + cur.fileSize, 0)
      ),
      imageCount$$q: computed(() => allImages.value.value?.length),
      imageFileCount$$q: computed(
        () => allImages.value.value?.flatMap((image) => image.files).length
      ),
      imageFileSizeCount$$q: computed(() =>
        allImages.value.value
          ?.flatMap((image) => image.files)
          .reduce((acc, cur) => acc + cur.fileSize, 0)
      ),
      sourceFileCount$$q: computed(() => allSourceFiles.value.value?.length),
      sourceFileSizeCount$$q: computed(() =>
        allSourceFiles.value.value?.reduce((acc, cur) => acc + cur.fileSize, 0)
      ),
      inUseSourceFileCount$$q: computed(
        () =>
          allSourceFiles.value.value?.filter(
            (sourceFile) => sourceFile.entityExists
          ).length
      ),
      inUseSourceFileSizeCount$$q: computed(() =>
        allSourceFiles.value.value
          ?.filter((sourceFile) => sourceFile.entityExists)
          .reduce((acc, cur) => acc + cur.fileSize, 0)
      ),
      h: humanizeSize,
    };
  },
});
</script>

<template>
  <v-container fluid>
    <header class="s-title mb-4">
      <div class="text-h5">
        {{ t('usage.Usage') }}
      </div>
    </header>
    <div>
      <div>Albums: {{ albumCount$$q }}</div>
      <div>Artists: {{ artistCount$$q }}</div>
      <div>Tracks: {{ trackCount$$q }}</div>
      <div>Images: {{ imageCount$$q }}</div>
      <div>
        Track files: {{ trackFileCount$$q }},
        {{ h(trackFileSizeCount$$q || 0) }}
      </div>
      <div>
        Image files: {{ imageFileCount$$q }},
        {{ h(imageFileSizeCount$$q || 0) }}
      </div>
      <div>
        Source files: {{ sourceFileCount$$q }},
        {{ h(sourceFileSizeCount$$q || 0) }}
      </div>
      <div>
        Source files (in use): {{ inUseSourceFileCount$$q }},
        {{ h(inUseSourceFileSizeCount$$q || 0) }}
      </div>
    </div>
  </v-container>
</template>
