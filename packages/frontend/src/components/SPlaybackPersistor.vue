<script lang="ts">
import { usePlaybackStore } from '~/stores/playback';

export default defineComponent({
  setup() {
    usePlaybackStore();

    return {};
  },
});
</script>
