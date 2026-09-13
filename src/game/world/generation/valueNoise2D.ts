export interface ValueNoise2D {
  /** Échantillonne un bruit continu déterministe dans [0, 1]. */
  sample(x: number, z: number): number;
}

/** Crée un value noise 2D déterministe avec interpolation douce. */
export function createValueNoise2D(seed: number): ValueNoise2D {
  return {
    sample(x: number, z: number): number {
      const x0 = Math.floor(x);
      const z0 = Math.floor(z);
      const xBlend = smooth(x - x0);
      const zBlend = smooth(z - z0);
      const top = interpolate(
        latticeValue(x0, z0, seed),
        latticeValue(x0 + 1, z0, seed),
        xBlend,
      );
      const bottom = interpolate(
        latticeValue(x0, z0 + 1, seed),
        latticeValue(x0 + 1, z0 + 1, seed),
        xBlend,
      );
      return interpolate(top, bottom, zBlend);
    },
  };
}

function latticeValue(x: number, z: number, seed: number): number {
  let value = seed ^ Math.imul(x, 0x1f12_3bb5) ^ Math.imul(z, 0x5f35_6495);
  value = Math.imul(value ^ (value >>> 16), 0x7feb_352d);
  value = Math.imul(value ^ (value >>> 15), 0x846c_a68b);
  return ((value ^ (value >>> 16)) >>> 0) / 0xffff_ffff;
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value);
}

function interpolate(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}
