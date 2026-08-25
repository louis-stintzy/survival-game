import type { HarvestableResourceType } from "./resourceTypes";

export const HARVEST_DURATION_SECONDS: Record<
  HarvestableResourceType,
  number
> = {
  wood: 3,
  stone: 4,
};
