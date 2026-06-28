// Tactile UI sound effects for the whimsical chrome. Samples are bundled
// (offline PWA) and played via pooled HTMLAudioElements so overlapping clicks
// don't cut each other off. Mute state persists in localStorage.
import clickUrl from '@/assets/sounds/click.mp3';
import hoverUrl from '@/assets/sounds/hover.mp3';
import addUrl from '@/assets/sounds/add.mp3';
import deleteUrl from '@/assets/sounds/delete.mp3';
import saveUrl from '@/assets/sounds/save.mp3';
import printUrl from '@/assets/sounds/print.mp3';
import errorUrl from '@/assets/sounds/error.mp3';

export type SoundName =
  | 'click'
  | 'hover'
  | 'add'
  | 'delete'
  | 'save'
  | 'print'
  | 'error';

const URLS: Record<SoundName, string> = {
  click: clickUrl,
  hover: hoverUrl,
  add: addUrl,
  delete: deleteUrl,
  save: saveUrl,
  print: printUrl,
  error: errorUrl,
};

// Per-sound relative gain so the mix feels even.
const GAIN: Record<SoundName, number> = {
  click: 0.5,
  hover: 0.28,
  add: 0.7,
  delete: 0.7,
  save: 0.7,
  print: 0.8,
  error: 0.7,
};

const MUTE_KEY = 'ns.sound.muted';
const POOL_SIZE = 4;

class SoundService {
  private pools: Partial<Record<SoundName, HTMLAudioElement[]>> = {};
  private cursor: Partial<Record<SoundName, number>> = {};
  private muted: boolean;
  private listeners = new Set<(muted: boolean) => void>();
  private lastHover = 0;

  constructor() {
    this.muted =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(MUTE_KEY) === '1';
  }

  private pool(name: SoundName): HTMLAudioElement[] {
    let p = this.pools[name];
    if (!p) {
      p = Array.from({ length: POOL_SIZE }, () => {
        const a = new Audio(URLS[name]);
        a.preload = 'auto';
        a.volume = GAIN[name];
        return a;
      });
      this.pools[name] = p;
      this.cursor[name] = 0;
    }
    return p;
  }

  play(name: SoundName) {
    if (this.muted || typeof Audio === 'undefined') return;
    // Throttle hover so rapid pointer travel doesn't machine-gun the blip.
    if (name === 'hover') {
      const now = performance.now();
      if (now - this.lastHover < 70) return;
      this.lastHover = now;
    }
    const p = this.pool(name);
    const i = this.cursor[name]!;
    this.cursor[name] = (i + 1) % p.length;
    const a = p[i];
    try {
      a.currentTime = 0;
      void a.play().catch(() => {});
    } catch {
      /* ignore autoplay / decode hiccups */
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      /* ignore */
    }
    this.listeners.forEach((l) => l(muted));
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    if (!this.muted) this.play('click');
  }

  subscribe(fn: (muted: boolean) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const sound = new SoundService();
