import { describe, expect, test } from "vitest";
import { createToolInventory } from "./createToolInventory";

describe("createToolInventory", () => {
  test("commence avec les deux compteurs à zéro", () => {
    const inventory = createToolInventory();

    expect(inventory.getCount("stoneAxe")).toBe(0);
    expect(inventory.getCount("stonePickaxe")).toBe(0);
  });

  test("ajoute une Hache de pierre", () => {
    const inventory = createToolInventory();

    inventory.add("stoneAxe", 1);

    expect(inventory.getCount("stoneAxe")).toBe(1);
  });

  test("cumule les ajouts successifs", () => {
    const inventory = createToolInventory();

    inventory.add("stoneAxe", 1);
    inventory.add("stoneAxe", 2);

    expect(inventory.getCount("stoneAxe")).toBe(3);
  });

  test("conserve des compteurs indépendants", () => {
    const inventory = createToolInventory();

    inventory.add("stoneAxe", 1);

    expect(inventory.getCount("stonePickaxe")).toBe(0);
  });

  test.each([0, -1, 1.5])("refuse la quantité invalide %s", (amount) => {
    const inventory = createToolInventory();

    expect(() => inventory.add("stoneAxe", amount)).toThrow();
  });
});
