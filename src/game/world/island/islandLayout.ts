export interface TreePlacement {
  x: number;
  z: number;
  scale: number;
  rotation: number;
}

export interface RockPlacement {
  x: number;
  z: number;
  scale: number;
  groundHeight: number;
  rotation: number;
}

export const GRASS_HEIGHT = 0.75;
export const ROCKY_PLATEAU_HEIGHT = 1.15;

export const TREE_PLACEMENTS: TreePlacement[] = [
  { x: -11.5, z: -1.5, scale: 1.05, rotation: 0.2 },
  { x: -11.8, z: 2.2, scale: 0.9, rotation: 1.1 },
  { x: -10.2, z: 5.5, scale: 1.15, rotation: 0.6 },
  { x: -8.5, z: -2.8, scale: 0.95, rotation: 1.8 },
  { x: -8.7, z: 1.2, scale: 1.1, rotation: 2.5 },
  { x: -8, z: 7.6, scale: 0.88, rotation: 0.9 },
  { x: -6.2, z: 4.8, scale: 1.08, rotation: 2.1 },
  { x: -6, z: 0.2, scale: 0.92, rotation: 1.4 },
  { x: -5.2, z: 7.3, scale: 1, rotation: 2.8 },
  { x: -12.8, z: 5.3, scale: 0.85, rotation: 1.7 },
  { x: -9.8, z: 8.7, scale: 1.02, rotation: 0.4 },
  { x: 4.2, z: 7.4, scale: 0.9, rotation: 2.3 },
  { x: 11.5, z: 1.8, scale: 0.95, rotation: 1.2 },
];

export const ROCK_PLACEMENTS: RockPlacement[] = [
  {
    x: 6.2,
    z: -4.2,
    scale: 1.2,
    groundHeight: ROCKY_PLATEAU_HEIGHT,
    rotation: -4.2,
  },
  {
    x: 8.1,
    z: -2.7,
    scale: 0.8,
    groundHeight: ROCKY_PLATEAU_HEIGHT,
    rotation: -2.7,
  },
  {
    x: 9.7,
    z: -4.5,
    scale: 1.05,
    groundHeight: ROCKY_PLATEAU_HEIGHT,
    rotation: -4.5,
  },
  {
    x: 7.7,
    z: -5.2,
    scale: 0.65,
    groundHeight: ROCKY_PLATEAU_HEIGHT,
    rotation: -5.2,
  },
  {
    x: 10.1,
    z: -2.4,
    scale: 0.6,
    groundHeight: ROCKY_PLATEAU_HEIGHT,
    rotation: -2.4,
  },
  { x: -2.5, z: -9.8, scale: 1, groundHeight: GRASS_HEIGHT, rotation: -9.8 },
  { x: 3.2, z: 9.2, scale: 0.85, groundHeight: GRASS_HEIGHT, rotation: 9.2 },
  { x: -13.2, z: -4.4, scale: 0.7, groundHeight: GRASS_HEIGHT, rotation: -4.4 },
];
