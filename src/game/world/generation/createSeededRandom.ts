const UINT32_MAX = 0xffff_ffff;
const UINT32_RANGE = 0x1_0000_0000;

export interface SeededRandom {
  /** Retourne la prochaine valeur pseudo-aléatoire dans l'intervalle [0, 1). */
  next(): number;
  /** Retourne une valeur pseudo-aléatoire dans l'intervalle [min, max). */
  float(min: number, max: number): number;
  /** Retourne un entier pseudo-aléatoire entre les deux bornes incluses. */
  integer(minInclusive: number, maxInclusive: number): number;
}

/**
 * Crée un PRNG Mulberry32 déterministe destiné à la génération du jeu.
 * Il est stable et rapide, mais ne doit jamais être utilisé en cryptographie.
 */
export function createSeededRandom(seed: number): SeededRandom {
  assertUint32(seed, "seed");
  let state = seed >>> 0;

  function next(): number {
    state = (state + 0x6d2b_79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;
  }

  return {
    next,

    float(min: number, max: number): number {
      assertFiniteRange(min, max);
      return min + next() * (max - min);
    },

    integer(minInclusive: number, maxInclusive: number): number {
      if (
        !Number.isSafeInteger(minInclusive) ||
        !Number.isSafeInteger(maxInclusive)
      ) {
        throw new RangeError(
          "Les bornes de integer() doivent être des entiers sûrs.",
        );
      }
      if (minInclusive > maxInclusive) {
        throw new RangeError(
          "La borne minimale de integer() ne peut pas dépasser la borne maximale.",
        );
      }

      const valueCount = maxInclusive - minInclusive + 1;
      if (!Number.isSafeInteger(valueCount)) {
        throw new RangeError("L'intervalle de integer() est trop grand.");
      }
      return minInclusive + Math.floor(next() * valueCount);
    },
  };
}

function assertUint32(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > UINT32_MAX) {
    throw new RangeError(`${name} doit être un entier non signé sur 32 bits.`);
  }
}

function assertFiniteRange(min: number, max: number): void {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new RangeError("Les bornes de float() doivent être finies.");
  }
  if (min > max) {
    throw new RangeError(
      "La borne minimale de float() ne peut pas dépasser la borne maximale.",
    );
  }
}
