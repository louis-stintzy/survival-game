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
  z: -19.5,
  groundHeight: BEACH_HEIGHT,
};

export const TREE_PLACEMENTS: TreePlacement[] = [
  // ============================================================
  // Masse forestière ouest
  //
  // Les arbres sont volontairement très rapprochés par endroits :
  // certaines zones doivent former une véritable barrière naturelle.
  // ============================================================

  { x: -17.8, z: -0.8, scale: 1.02, rotation: 0.2 },
  { x: -16.2, z: -0.1, scale: 0.94, rotation: 1.1 },
  { x: -14.6, z: -0.9, scale: 1.08, rotation: 2.0 },
  { x: -13.0, z: -0.2, scale: 0.91, rotation: 0.7 },
  { x: -11.4, z: -1.0, scale: 1.05, rotation: 2.6 },
  { x: -9.8, z: -0.2, scale: 0.96, rotation: 1.5 },
  { x: -8.3, z: -0.9, scale: 1.08, rotation: 0.4 },

  { x: -18.2, z: 1.2, scale: 0.92, rotation: 1.9 },
  { x: -16.6, z: 1.8, scale: 1.06, rotation: 2.8 },
  { x: -15.0, z: 1.1, scale: 0.98, rotation: 0.6 },
  { x: -13.4, z: 1.9, scale: 1.1, rotation: 1.4 },
  { x: -11.8, z: 1.2, scale: 0.9, rotation: 2.3 },
  { x: -10.2, z: 1.9, scale: 1.04, rotation: 0.9 },
  { x: -8.6, z: 1.2, scale: 0.97, rotation: 2.1 },

  { x: -17.8, z: 3.6, scale: 1.08, rotation: 0.3 },
  { x: -16.2, z: 4.2, scale: 0.91, rotation: 1.7 },
  { x: -14.6, z: 3.5, scale: 1.03, rotation: 2.5 },
  { x: -13.0, z: 4.3, scale: 0.96, rotation: 0.8 },
  { x: -11.4, z: 3.6, scale: 1.09, rotation: 1.3 },
  { x: -9.8, z: 4.3, scale: 0.92, rotation: 2.7 },
  { x: -8.2, z: 3.6, scale: 1.04, rotation: 0.5 },

  { x: -17.4, z: 6.0, scale: 0.95, rotation: 2.2 },
  { x: -15.8, z: 6.6, scale: 1.07, rotation: 0.7 },
  { x: -14.2, z: 5.9, scale: 0.91, rotation: 1.8 },
  { x: -12.6, z: 6.7, scale: 1.1, rotation: 2.9 },
  { x: -11.0, z: 6.0, scale: 0.97, rotation: 1.0 },
  { x: -9.4, z: 6.7, scale: 1.05, rotation: 2.4 },
  { x: -8.0, z: 5.9, scale: 0.93, rotation: 0.3 },

  { x: -16.8, z: 8.4, scale: 1.06, rotation: 1.4 },
  { x: -15.2, z: 9.0, scale: 0.92, rotation: 2.6 },
  { x: -13.6, z: 8.3, scale: 1.08, rotation: 0.8 },
  { x: -12.0, z: 9.1, scale: 0.95, rotation: 1.9 },
  { x: -10.4, z: 8.4, scale: 1.04, rotation: 2.8 },
  { x: -8.8, z: 9.1, scale: 0.9, rotation: 0.4 },
  { x: -8.0, z: 8.2, scale: 1.08, rotation: 1.5 },

  // ----- Partie nord-ouest -----

  { x: -16.0, z: 10.8, scale: 0.94, rotation: 2.0 },
  { x: -14.4, z: 11.4, scale: 1.07, rotation: 0.6 },
  { x: -12.8, z: 10.7, scale: 0.91, rotation: 1.7 },
  { x: -11.2, z: 11.5, scale: 1.06, rotation: 2.5 },
  { x: -9.6, z: 10.8, scale: 0.98, rotation: 0.9 },
  { x: -8.2, z: 11.4, scale: 1.04, rotation: 2.2 },

  { x: -14.8, z: 13.1, scale: 1.02, rotation: 0.5 },
  { x: -13.2, z: 13.7, scale: 0.91, rotation: 1.6 },
  { x: -11.6, z: 13.0, scale: 1.08, rotation: 2.7 },
  { x: -10.0, z: 13.8, scale: 0.95, rotation: 0.8 },
  { x: -8.5, z: 13.1, scale: 1.03, rotation: 1.9 },

  { x: -12.2, z: 15.0, scale: 0.94, rotation: 2.4 },
  { x: -10.6, z: 14.7, scale: 1.07, rotation: 0.3 },
  { x: -9.0, z: 14.3, scale: 0.92, rotation: 1.5 },

  // ============================================================
  // Bord est du chemin
  //
  // Aucun arbre n'est placé approximativement entre x = -7 et x = -4.
  // Cet espace vide dessine le chemin principal de la forêt.
  // ============================================================

  { x: -3.0, z: 3.0, scale: 1.03, rotation: 2.1 },
  { x: -1.4, z: 3.8, scale: 0.91, rotation: 0.7 },

  { x: -3.2, z: 5.3, scale: 1.08, rotation: 1.6 },
  { x: -1.6, z: 6.0, scale: 0.95, rotation: 2.6 },
  { x: 0.0, z: 5.2, scale: 1.04, rotation: 0.4 },

  { x: -3.0, z: 7.6, scale: 0.92, rotation: 1.3 },
  { x: -1.4, z: 8.3, scale: 1.07, rotation: 2.4 },
  { x: 0.2, z: 7.4, scale: 0.96, rotation: 0.8 },

  { x: -3.2, z: 9.9, scale: 1.05, rotation: 1.8 },
  { x: -1.6, z: 10.6, scale: 0.9, rotation: 2.9 },
  { x: 0.0, z: 9.8, scale: 1.08, rotation: 0.5 },

  { x: -3.0, z: 12.2, scale: 0.94, rotation: 1.4 },
  { x: -1.4, z: 12.9, scale: 1.06, rotation: 2.3 },
  { x: 0.2, z: 12.0, scale: 0.93, rotation: 0.6 },

  { x: -2.8, z: 14.3, scale: 1.04, rotation: 1.7 },
  { x: -1.2, z: 14.8, scale: 0.91, rotation: 2.5 },

  // ============================================================
  // Sous-bois très dense
  //
  // Ces arbres ferment volontairement certains passages internes.
  // Le chemin principal reste libre à l'est de cette masse.
  // ============================================================

  { x: -17.0, z: 2.8, scale: 0.96, rotation: 1.2 },
  { x: -15.7, z: 2.7, scale: 1.04, rotation: 2.4 },
  { x: -14.4, z: 2.9, scale: 0.92, rotation: 0.5 },
  { x: -13.1, z: 2.8, scale: 1.06, rotation: 1.8 },
  { x: -11.8, z: 2.9, scale: 0.97, rotation: 2.7 },
  { x: -10.5, z: 2.7, scale: 1.03, rotation: 0.8 },
  { x: -9.2, z: 2.9, scale: 0.94, rotation: 1.6 },

  { x: -16.4, z: 5.2, scale: 1.05, rotation: 2.1 },
  { x: -15.1, z: 5.1, scale: 0.93, rotation: 0.6 },
  { x: -13.8, z: 5.3, scale: 1.02, rotation: 1.7 },
  { x: -12.5, z: 5.1, scale: 0.97, rotation: 2.8 },
  { x: -11.2, z: 5.3, scale: 1.06, rotation: 0.9 },
  { x: -9.9, z: 5.1, scale: 0.92, rotation: 1.5 },
  { x: -8.6, z: 5.3, scale: 1.04, rotation: 2.3 },

  { x: -16.0, z: 7.7, scale: 0.95, rotation: 0.4 },
  { x: -14.7, z: 7.6, scale: 1.07, rotation: 1.9 },
  { x: -13.4, z: 7.8, scale: 0.94, rotation: 2.5 },
  { x: -12.1, z: 7.6, scale: 1.03, rotation: 0.7 },
  { x: -10.8, z: 7.8, scale: 0.96, rotation: 1.6 },
  { x: -9.5, z: 7.6, scale: 1.05, rotation: 2.7 },

  // ----- Arbres isolés hors de la forêt -----

  { x: 6.5, z: 11.0, scale: 0.95, rotation: 0.9 },
  { x: 12.5, z: 5.5, scale: 1.02, rotation: 2.0 },
  { x: -2.5, z: -8.7, scale: 0.94, rotation: 1.8 },
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
