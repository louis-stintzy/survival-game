import { describe, expect, test } from "vitest";
import { createSeededRandom } from "./createSeededRandom";

describe("createSeededRandom", () => {
  test("fige la séquence Mulberry32 de la seed 12345", () => {
    const random = createSeededRandom(12345);

    expect(Array.from({ length: 5 }, () => random.next())).toEqual([
      0.9797282677609473,
      0.3067522644996643,
      0.484205421525985,
      0.817934412509203,
      0.5094283693470061,
    ]);
  });

  test("produit la même séquence avec la même seed", () => {
    const first = createSeededRandom(42);
    const second = createSeededRandom(42);

    expect(Array.from({ length: 10 }, () => first.next())).toEqual(
      Array.from({ length: 10 }, () => second.next()),
    );
  });

  test("produit des séquences différentes avec des seeds différentes", () => {
    const first = createSeededRandom(1);
    const second = createSeededRandom(2);

    expect(Array.from({ length: 5 }, () => first.next())).not.toEqual(
      Array.from({ length: 5 }, () => second.next()),
    );
  });

  test("maintient next() dans [0, 1)", () => {
    const random = createSeededRandom(12345);

    for (let index = 0; index < 1_000; index += 1) {
      const value = random.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  test("maintient float() dans les bornes demandées", () => {
    const random = createSeededRandom(12345);

    for (let index = 0; index < 1_000; index += 1) {
      const value = random.float(-4.5, 8.25);
      expect(value).toBeGreaterThanOrEqual(-4.5);
      expect(value).toBeLessThan(8.25);
    }
    expect(random.float(3, 3)).toBe(3);
  });

  test("produit des entiers dans les bornes inclusives", () => {
    const random = createSeededRandom(12345);
    const values = Array.from({ length: 1_000 }, () => random.integer(2, 4));

    values.forEach((value) => {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(2);
      expect(value).toBeLessThanOrEqual(4);
    });
    expect(values).toContain(2);
    expect(values).toContain(4);
    expect(random.integer(7, 7)).toBe(7);
  });

  test("refuse une seed qui n'est pas un uint32", () => {
    expect(() => createSeededRandom(-1)).toThrow(RangeError);
    expect(() => createSeededRandom(1.5)).toThrow(RangeError);
    expect(() => createSeededRandom(0x1_0000_0000)).toThrow(RangeError);
  });

  test("refuse les bornes incohérentes de float()", () => {
    const random = createSeededRandom(1);

    expect(() => random.float(2, 1)).toThrow(RangeError);
    expect(() => random.float(Number.NaN, 1)).toThrow(RangeError);
    expect(() => random.float(0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  test("refuse les bornes incohérentes de integer()", () => {
    const random = createSeededRandom(1);

    expect(() => random.integer(2, 1)).toThrow(RangeError);
    expect(() => random.integer(0.5, 2)).toThrow(RangeError);
    expect(() =>
      random.integer(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
    ).toThrow(RangeError);
  });
});
