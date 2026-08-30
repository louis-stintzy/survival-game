const BROWN = "#61361A";
const STONE_GRAY = "#616E70";

export const GAME_PALETTE = {
  world: {
    water: "#2E9EC7",
    sand: "#E8BF75",
    grass: "#4DAD52",
    trunk: BROWN,
    leaves: "#1F7A3D",
    rock: STONE_GRAY,
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

  tools: {
    handle: BROWN,
    head: STONE_GRAY,
  },
} as const;
