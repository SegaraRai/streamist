import { db } from '~/db';
import { usePlaybackStore } from '~/stores/playback';
import { useLiveQuery } from './useLiveQuery';

export function useCurrentTrackInfo() {
  const playbackStore = usePlaybackStore();

  return useLiveQuery(async () => {
    const trackId = playbackStore.currentTrack$$q.value;
    if (!trackId) {
      return;
    }

    const track$$q = await db.tracks.get(trackId);
    if (!track$$q) {
      return;
    }

    const trackArtist$$q = await db.artists.get(track$$q.artistId);
    if (!trackArtist$$q) {
      return;
    }

    return {
      track$$q,
      trackArtist$$q,
    };
  }, [playbackStore.currentTrack$$q]);
}
