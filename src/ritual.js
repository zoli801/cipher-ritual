export const CANDLE_COUNT = 8;
export const RICKROLL_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
export const durations = Object.freeze({ awakening: 6.2, summoning: 7.4, handshake: 4.2, collapse: 5.4, weirdmageddon: 8.8, blackout: 1.8 });

const allowed = Object.freeze({
  loading: ['ritual', 'fallback'], ritual: ['awakening'], awakening: ['journal'],
  journal: ['summoning'], summoning: ['offer'], offer: ['handshake', 'declined'],
  handshake: ['collapse'], collapse: ['weirdmageddon'], weirdmageddon: ['blackout'],
  blackout: ['result'], result: ['ritual', 'blackout'], fallback: [], declined: [],
});

export class Ritual {
  constructor() { this.stage = 'loading'; this.lit = new Set(); }
  transition(next) {
    if (!allowed[this.stage]?.includes(next)) return false;
    if (next === 'awakening' && !this.complete) return false;
    this.stage = next;
    if (next === 'ritual') this.lit.clear();
    return true;
  }
  light(index) {
    if (this.stage !== 'ritual' || !Number.isInteger(index) || index < 0 || index >= CANDLE_COUNT || this.lit.has(index)) return false;
    this.lit.add(index);
    return true;
  }
  get complete() { return this.lit.size === CANDLE_COUNT; }
}

/** Uniform integer in [0, 100]. Reject the biased tail of the uint32 range. */
export function randomNumber(cryptoSource = globalThis.crypto) {
  const range = 101;
  const limit = Math.floor(0x100000000 / range) * range;
  const value = new Uint32Array(1);
  do { cryptoSource.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % range;
}

export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const smooth = (v) => { const x = clamp(v); return x * x * (3 - 2 * x); };
export const easeOut = (v) => 1 - Math.pow(1 - clamp(v), 3);

/** Distance to a pointer segment, so quick drags cannot skip a wick. */
export function segmentDistance(point, start, end) {
  const dx = end.x - start.x, dy = end.y - start.y;
  const len = dx * dx + dy * dy;
  const t = len ? clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / len) : 0;
  return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy);
}
