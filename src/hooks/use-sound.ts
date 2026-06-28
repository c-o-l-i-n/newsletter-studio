import { useSyncExternalStore } from 'react';
import { sound } from '@/services/sound';

/** Subscribe to the global mute state and get a toggle. */
export function useMuted(): [boolean, () => void] {
  const muted = useSyncExternalStore(
    (cb) => sound.subscribe(cb),
    () => sound.isMuted(),
    () => true,
  );
  return [muted, () => sound.toggleMuted()];
}

export { sound };
