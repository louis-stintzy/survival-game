const BROWN = "#61361A";
const STONE_GRAY = "#616E70";
const SAND = "#E8BF75";
const GRASS = "#4DAD52";
const WATER = "#2E9EC7";

// const STONE_GRAY = "#979287";
// const SAND = "#F3D187";
// const GRASS = "#81D24F";

export const GAME_PALETTE = {
  world: {
    water: WATER,
    sand: SAND,
    grass: GRASS,
    trunk: BROWN,
    leaves: "#1F7A3D",
    rock: STONE_GRAY,
    raft: BROWN,
  },

  terrain: {
    sandTop: SAND,
    sandSide: "#CFA45F",
    grassTop: GRASS,
    dirtSide: "#85502A",
    rockTop: STONE_GRAY,
    rockSide: "#515D5F",
    deepRockSide: "#465153",
    seabedShallow: "#D9B878",
    seabedDeep: "#92917B",
  },

  player: {
    body: "#EB4D2E",
  },

  building: {
    shelter: {
      posts: BROWN,
      roof: "#A8662E",
    },

    workbench: {
      top: BROWN,
      legs: BROWN,
      stonePlate: STONE_GRAY,
    },
  },

  placement: {
    valid: "#33D959",
    invalid: "#E6332E",
  },

  equipment: {
    handle: BROWN,
    head: STONE_GRAY,
    flame: "#FF9F1C",
  },
} as const;
