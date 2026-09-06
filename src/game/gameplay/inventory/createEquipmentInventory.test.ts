import { describe, expect, test } from "vitest";
import { createEquipmentInventory } from "./createEquipmentInventory";

describe("createEquipmentInventory", () => {
  test("commence avec tous les compteurs à zéro", () => {
    const inventory = createEquipmentInventory();

    expect(inventory.getCount("stoneAxe")).toBe(0);
    expect(inventory.getCount("stonePickaxe")).toBe(0);
    expect(inventory.getCount("torch")).toBe(0);
  });

  test("ajoute et cumule des équipements", () => {
    const inventory = createEquipmentInventory();

    inventory.add("torch", 1);
    inventory.add("torch", 2);

    expect(inventory.getCount("torch")).toBe(3);
  });

  test("conserve des compteurs indépendants", () => {
    const inventory = createEquipmentInventory();

    inventory.add("torch", 1);

    expect(inventory.getCount("stoneAxe")).toBe(0);
    expect(inventory.getCount("stonePickaxe")).toBe(0);
  });

  test.each([0, -1, 1.5])("refuse la quantité invalide %s", (amount) => {
    const inventory = createEquipmentInventory();

    expect(() => inventory.add("torch", amount)).toThrow();
  });
});
