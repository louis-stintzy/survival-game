export const RESOURCE_TYPES = ["wood", "stone", "food"] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export type HarvestableResourceType = Exclude<ResourceType, "food">;

export type ResourceCost = Partial<Record<ResourceType, number>>;
