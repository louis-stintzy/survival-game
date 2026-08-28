# Survival Game

Un prototype très précoce d'un jeu 3D de survie et de construction jouable dans un navigateur. Le joueur peut explorer une petite île low-poly et y récolter des ressources.

## Stack technique

- TypeScript
- Vite
- Babylon.js (`@babylonjs/core`)
- npm

## Prérequis

- Node.js 20.19+ ou Node.js 22.12+
- npm

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Vite affiche alors l'adresse locale à ouvrir dans un navigateur.

### Contrôles

- ZQSD / WASD / flèches directionnelles : déplacement
- Maintenir E : récolter une ressource proche
- E près d'un établi : ouvrir l'établi
- Dans l'établi, Tab : changer de recette
- Dans l'établi, E : fabriquer
- Dans l'établi, Échap : fermer
- 1 : équiper les mains
- 2 : équiper la Hache de pierre si possédée
- 3 : équiper la Pioche de pierre si possédée
- B : entrer en mode construction (Abri sélectionné par défaut)
- Tab : changer de bâtiment en mode construction
- R : tourner le bâtiment de 90°
- Clic gauche : construire
- Échap : annuler le placement
- C : tourner la caméra de +90°
- Maj + C : tourner la caméra de -90°

## Construction

```bash
npm run build
```

La version prête à être déployée est générée dans `dist/`.

## Tests

```bash
npm test
```

Le mode interactif est également disponible avec `npm run test:watch`. Les tests actuels couvrent quelques règles TypeScript pures de gameplay, sans lancer le rendu Babylon.js.
