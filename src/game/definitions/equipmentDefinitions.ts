import type { ResourceCost } from "./resourceDefinitions";

export const EQUIPMENT_TYPES = ["stoneAxe", "stonePickaxe", "torch"] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];
export type EquippedItem = "hands" | EquipmentType;

interface EquipmentDefinition {
  label: string;
  cost: ResourceCost;
  craftingDurationSeconds: number;
}

export const EQUIPMENT_DEFINITIONS: Record<
  EquipmentType,
  EquipmentDefinition
> = {
  stoneAxe: {
    label: "Hache de pierre",
    cost: { wood: 2, stone: 1 },
    craftingDurationSeconds: 2,
  },
  stonePickaxe: {
    label: "Pioche de pierre",
    cost: { wood: 1, stone: 2 },
    craftingDurationSeconds: 2,
  },
  torch: {
    label: "Torche",
    cost: { wood: 1 },
    craftingDurationSeconds: 1.5,
  },
};
