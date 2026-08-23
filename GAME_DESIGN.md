# Game Design

## Vision

Un jeu de survie et de construction en 3D, jouable dans un navigateur. La direction visuelle est colorée, low-poly et proche d'un diorama. Le jeu utilise une caméra haute orthographique, proche d'une vue isométrique.

Le premier monde sera une petite île conçue manuellement. À plus long terme, les mondes pourront devenir partiellement ou totalement procéduraux.

## Monde et ressources

Les premiers biomes envisagés sont la plage, la prairie, la forêt, la zone rocheuse et l'eau. Les premières ressources seront le bois, la pierre et la nourriture.

## Boucle principale

> explorer → récolter → fabriquer → construire → survivre → améliorer → explorer davantage

Les bâtiments seront placés comme des constructions complètes, et non assemblés mur par mur. Leur placement utilisera plus tard une grille et une prévisualisation transparente indiquant si l'emplacement est valide.

Une première condition de victoire possible serait de survivre trois nuits. À plus long terme, le joueur pourrait chercher à quitter l'île ou à retrouver la civilisation.

## Technique et périmètre

Le prototype repose sur TypeScript, Vite et Babylon.js. Le jeu initial est solo. Le multijoueur est un objectif futur important, mais il est explicitement hors périmètre pour le moment. Une future architecture multijoueur pourrait utiliser Node.js, TypeScript et Colyseus.

## Not now

- multijoueur ;
- monde procédural infini ;
- terrain en voxels ;
- systèmes de survie avancés.
