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
- E : récolter un arbre ou un rocher proche
- B : activer le mode construction
- R : tourner l'abri de 90°
- Clic gauche : construire
- Échap : quitter le mode construction

## Construction

```bash
npm run build
```

La version prête à être déployée est générée dans `dist/`.
