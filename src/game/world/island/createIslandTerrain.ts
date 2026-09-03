import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";

interface IslandTerrainMaterials {
  water: StandardMaterial;
  sand: StandardMaterial;
  grass: StandardMaterial;
  rock: StandardMaterial;
}

/**
 * Surfaces physiques constituant le terrain de l'île.
 *
 * Ces meshes sont ensuite utilisés par les différents systèmes du jeu
 * pour déterminer les surfaces praticables, constructibles ou sélectionnables.
 */
export interface IslandTerrain {
  water: Mesh;
  beach: Mesh;
  grass: Mesh;
  rockyPlateau: Mesh;
}

/**
 * Crée les différentes strates physiques du terrain de l'île.
 *
 * L'île est actuellement constituée :
 * - d'une étendue d'eau ;
 * - d'une plage ;
 * - d'une zone principale d'herbe ;
 * - d'un plateau rocheux surélevé.
 *
 * Cette fonction crée uniquement le terrain. Elle ne crée ni les arbres,
 * ni les rochers récoltables, ni les autres éléments de gameplay.
 *
 * @param scene Scène Babylon dans laquelle créer les meshes.
 * @param materials Matériaux visuels utilisés par les différentes surfaces.
 * @returns Les meshes constituant les différentes strates du terrain.
 */
export function createIslandTerrain(
  scene: Scene,
  materials: IslandTerrainMaterials,
): IslandTerrain {
  const water = MeshBuilder.CreateCylinder(
    "water",
    { diameter: 100, height: 0.6, tessellation: 48 },
    scene,
  );
  water.position.y = -0.55;
  water.material = materials.water;
  water.receiveShadows = true;

  const beach = MeshBuilder.CreateCylinder(
    "beach",
    { diameter: 52, height: 1.1, tessellation: 16 },
    scene,
  );
  beach.position.y = -0.2;
  beach.scaling.z = 0.82;
  beach.rotation.y = 0.08;
  beach.material = materials.sand;
  beach.receiveShadows = true;

  const grass = MeshBuilder.CreateCylinder(
    "grass",
    { diameter: 46, height: 1, tessellation: 15 },
    scene,
  );
  grass.position.y = 0.25;
  grass.scaling.z = 0.8;
  grass.rotation.y = -0.06;
  grass.material = materials.grass;
  grass.receiveShadows = true;

  const rockyPlateau = MeshBuilder.CreateCylinder(
    "rocky-plateau",
    { diameter: 11, height: 0.4, tessellation: 9 },
    scene,
  );
  rockyPlateau.position = new Vector3(11, 0.95, -5.5);
  rockyPlateau.scaling.z = 0.75;
  rockyPlateau.rotation.y = 0.2;
  rockyPlateau.material = materials.rock;
  rockyPlateau.receiveShadows = true;

  return {
    water,
    beach,
    grass,
    rockyPlateau,
  };
}
