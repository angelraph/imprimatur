// Deterministic randomness. Same seed string -> same exam, on any machine.

export function hashSeed(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export interface Rng {
  next(): number;
  int(lo: number, hi: number): number;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
  hex(len: number): string;
  cents(lo: number, hi: number): number;
}

export function makeRng(seed: string): Rng {
  let a = hashSeed(seed);
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1));
  return {
    next,
    int,
    pick: (arr) => arr[int(0, arr.length - 1)],
    shuffle: (arr) => {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(0, i);
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    hex: (len) => {
      let s = "";
      for (let i = 0; i < len; i++) s += "0123456789abcdef"[int(0, 15)];
      return s;
    },
    // A dollar amount between lo and hi, rounded to cents.
    cents: (lo, hi) => Math.round((lo + next() * (hi - lo)) * 100) / 100,
  };
}

export function newSeed(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
