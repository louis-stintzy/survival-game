export interface XZPosition {
  x: number;
  z: number;
}

/** Normale unitaire d'une surface bloquant la position candidate du joueur. */
export interface CollisionContact {
  normalX: number;
  normalZ: number;
}
