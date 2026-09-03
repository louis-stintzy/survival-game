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

export interface IslandSpawnPoint {
  x: number;
  z: number;
  groundHeight: number;
}

export const BEACH_HEIGHT = 0.35;
export const GRASS_HEIGHT = 0.75;
export const ROCKY_PLATEAU_HEIGHT = 1.15;

export const PLAYER_SPAWN: IslandSpawnPoint = {
  x: 0,
  z: 10,
  groundHeight: BEACH_HEIGHT,
};

export const TREE_PLACEMENTS: TreePlacement[] = [
  // ----- Lisière ouest -----

  { x: -18.2, z: -1.5, scale: 1.02, rotation: 0.2 },
  { x: -18.8, z: 2.2, scale: 0.91, rotation: 1.1 },
  { x: -18.1, z: 5.6, scale: 1.12, rotation: 0.6 },
  { x: -17.2, z: 9.1, scale: 0.96, rotation: 1.8 },
  { x: -15.8, z: 12.7, scale: 1.08, rotation: 2.5 },

  // ----- Nord / fond de forêt -----

  { x: -13.2, z: 14.2, scale: 0.9, rotation: 0.9 },
  { x: -10.1, z: 14.8, scale: 1.08, rotation: 2.1 },
  { x: -7.1, z: 14.1, scale: 0.94, rotation: 1.4 },
  { x: -4.6, z: 12.8, scale: 1.02, rotation: 2.8 },

  // ----- Cœur dense ouest -----

  { x: -15.4, z: 7.0, scale: 1.1, rotation: 1.7 },
  { x: -13.1, z: 9.4, scale: 0.88, rotation: 0.4 },
  { x: -11.3, z: 6.7, scale: 1.05, rotation: 2.3 },
  { x: -9.0, z: 9.7, scale: 0.97, rotation: 1.2 },
  { x: -6.6, z: 7.8, scale: 1.12, rotation: 0.7 },

  // ----- Zone intérieure sud-ouest -----

  { x: -15.7, z: 3.2, scale: 0.93, rotation: 2.2 },
  { x: -13.0, z: 4.4, scale: 1.05, rotation: 0.3 },
  { x: -10.5, z: 2.7, scale: 0.89, rotation: 1.5 },
  { x: -7.5, z: 4.1, scale: 1.04, rotation: 2.7 },

  // ----- Lisière vers la grande clairière -----

  { x: -15.3, z: -0.7, scale: 0.9, rotation: 0.8 },
  { x: -12.5, z: 0.1, scale: 1.03, rotation: 1.9 },
  { x: -9.5, z: -0.5, scale: 0.95, rotation: 2.4 },
  { x: -6.3, z: 1.0, scale: 1.07, rotation: 0.5 },

  // ----- Est de la forêt / sortie vers le nord -----

  { x: -4.2, z: 9.4, scale: 0.91, rotation: 1.3 },
  { x: -2.7, z: 6.2, scale: 1.04, rotation: 2.1 },
  { x: -3.7, z: 3.1, scale: 0.88, rotation: 0.6 },

  // ----- Quelques arbres isolés hors forêt -----

  { x: 1.8, z: 11.8, scale: 0.9, rotation: 2.5 },
  { x: 7.3, z: 10.1, scale: 1.02, rotation: 0.9 },
  { x: -2.4, z: -8.7, scale: 0.94, rotation: 1.8 },
  { x: 12.4, z: 5.2, scale: 0.97, rotation: 0.4 },
];

export const ROCK_PLACEMENTS: RockPlacement[] = [
  {
    x: 7.2,
    z: -5.0,
    scale: 1.15,
    groundHeight: ROCKY_PLATEAU_HEIGHT,
    rotation: 0.4,
  },
  {
    x: 9.5,
    z: -3.7,
    scale: 0.78,
    groundHeight: ROCKY_PLATEAU_HEIGHT,
    rotation: 1.3,
  },
  {
    x: 12.1,
    z: -4.2,
    scale: 1.05,
    groundHeight: ROCKY_PLATEAU_HEIGHT,
    rotation: 2.2,
  },
  {
    x: 14.5,
    z: -5.8,
    scale: 0.7,
    groundHeight: ROCKY_PLATEAU_HEIGHT,
    rotation: 0.8,
  },
  {
    x: 12.8,
    z: -7.4,
    scale: 0.9,
    groundHeight: ROCKY_PLATEAU_HEIGHT,
    rotation: 1.9,
  },
  {
    x: 9.6,
    z: -7.3,
    scale: 0.65,
    groundHeight: ROCKY_PLATEAU_HEIGHT,
    rotation: 2.7,
  },
  {
    x: 15.0,
    z: -3.7,
    scale: 0.58,
    groundHeight: ROCKY_PLATEAU_HEIGHT,
    rotation: 1.1,
  },
  { x: -2.5, z: -9.8, scale: 1, groundHeight: GRASS_HEIGHT, rotation: -9.8 },
  { x: 3.2, z: 9.2, scale: 0.85, groundHeight: GRASS_HEIGHT, rotation: 9.2 },
  { x: -13.2, z: -4.4, scale: 0.7, groundHeight: GRASS_HEIGHT, rotation: -4.4 },
];
