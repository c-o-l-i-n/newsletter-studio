// A little explosion at a screen point — used when something is deleted.
// Spawns a transient DOM burst (flash + smoke + shrapnel) and cleans up.
const COLORS = [
  'oklch(0.82 0.15 72)', // brass
  'oklch(0.62 0.18 42)', // ember
  'oklch(0.5 0.16 28)', // oxblood
  'oklch(0.72 0.13 92)', // gold
];

export function boom(x: number, y: number) {
  if (typeof document === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.createElement('div');
  root.className = 'boom';
  root.style.left = `${x}px`;
  root.style.top = `${y}px`;

  const smoke = document.createElement('span');
  smoke.className = 'smoke';
  const flash = document.createElement('span');
  flash.className = 'flash';
  root.append(smoke, flash);

  const N = 14;
  for (let i = 0; i < N; i++) {
    const p = document.createElement('i');
    const a = (360 / N) * i + Math.random() * 18;
    const d = 38 + Math.random() * 36;
    p.style.setProperty('--a', `${a}deg`);
    p.style.setProperty('--d', `${d}px`);
    p.style.setProperty('--c', COLORS[i % COLORS.length]);
    p.style.animationDelay = `${Math.random() * 40}ms`;
    root.appendChild(p);
  }

  document.body.appendChild(root);
  setTimeout(() => root.remove(), 820);
}

/** Convenience: explode at the centre of an element (e.g. a button). */
export function boomAt(el: Element | null) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  boom(r.left + r.width / 2, r.top + r.height / 2);
}
