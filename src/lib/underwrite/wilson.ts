// Wilson score interval, upper bound. With few trials the bound stays wide,
// which is the point: a short clean record should not earn a large limit.
export function wilsonUpper(failures: number, trials: number, z = 1.96): number {
  if (trials <= 0) return 1;
  const p = failures / trials;
  const z2 = z * z;
  const centre = p + z2 / (2 * trials);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * trials)) / trials);
  return Math.min(1, (centre + margin) / (1 + z2 / trials));
}
