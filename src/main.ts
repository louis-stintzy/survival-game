import { Engine } from "@babylonjs/core/Engines/engine";
import "./style.css";
import { createScene } from "./game/createScene";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
if (!canvas) throw new Error("Le canvas #game-canvas est introuvable.");

const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = createScene(engine, canvas);

// Un jeu redessine continuellement la scène afin que les animations et les
// futures interactions puissent être affichées image après image.
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
