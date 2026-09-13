export const DEFAULT_WORLD_SEED = 12345;
export const MAX_WORLD_SEED = 0xffff_ffff;

/** Convertit une valeur textuelle en seed uint32 ou utilise la seed par défaut. */
export function parseWorldSeed(value: string | null | undefined): number {
  if (!value || !/^\d+$/.test(value)) return DEFAULT_WORLD_SEED;

  const seed = Number(value);
  return Number.isInteger(seed) && seed <= MAX_WORLD_SEED
    ? seed
    : DEFAULT_WORLD_SEED;
}

/** Résout la seed depuis une query string telle que `?seed=12345`. */
export function resolveWorldSeed(search: string): number {
  return parseWorldSeed(new URLSearchParams(search).get("seed"));
}
