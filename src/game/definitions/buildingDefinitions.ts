import type { ResourceCost } from "./resourceDefinitions";

export const BUILDING_TYPES = ["shelter", "workbench"] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number];

export interface BuildingDefinition {
  label: string;
  cost: ResourceCost;
  width: number;
  depth: number;
}

export const BUILDING_DEFINITIONS: Record<BuildingType, BuildingDefinition> = {
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
