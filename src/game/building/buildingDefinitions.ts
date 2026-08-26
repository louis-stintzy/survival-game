import type { InventoryCost } from "../inventory/createInventory";

export type BuildingType = "shelter" | "workbench";

export interface BuildingDefinition {
  label: string;
  cost: InventoryCost;
  width: number;
  depth: number;
}

export const BUILDING_DEFINITIONS: Record<
  BuildingType,
  BuildingDefinition
> = {
  shelter: {
    label: "Abri",
    cost: { wood: 4, stone: 2 },
    width: 4,
    depth: 3,
  },
  workbench: {
    label: "Établi",
    cost: { wood: 2, stone: 1 },
    width: 2.5,
    depth: 1.5,
  },
};
