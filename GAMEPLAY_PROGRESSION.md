# Progression du gameplay

## Fonctionnalités actuellement implémentées

### Récolte et équipement

- Mains : bois en 3 secondes et pierre en 4 secondes.
- Hache de pierre : bois en 1,5 seconde ; incompatible avec la pierre.
- Pioche de pierre : pierre en 2 secondes ; incompatible avec le bois.
- La progression est annulée si E est relâchée ou si la cible est perdue.
- Maintenir E permet d'enchaîner plusieurs ressources valides à portée, une par une, chacune avec sa durée complète de récolte.

### Abri

- Coût actuel : 4 bois et 2 pierres.

### Établi

- Coût actuel : 2 bois et 1 pierre.
- Constructible sur la prairie.
- Interaction possible avec E à moins de 2,75 unités.
- E ouvre le menu de crafting.

### Équipements fabriqués à l'établi

- Hache de pierre : 2 bois, 1 pierre, 2 secondes de fabrication et équipable.
- Pioche de pierre : 1 bois, 2 pierres, 2 secondes de fabrication et équipable.
- Torche : 1 bois, 1,5 seconde de fabrication et équipable ; tenue en main, elle produit une lumière locale chaude.
- Plusieurs exemplaires de chaque équipement peuvent être conservés.
- Un équipement fraîchement fabriqué est automatiquement équipé.
- Quickbar : 1 pour les mains, 2 pour la hache, 3 pour la pioche et 4 pour la torche.
- Une torche équipée peut être posée librement sur le terrain avec un clic gauche ; la pose consomme un exemplaire.
- Les outils n'ont aucun système de durabilité.

### Collisions du monde

- Le joueur ne traverse pas les troncs, les rochers non récoltés, les établis ni les poteaux des abris construits.
- Le déplacement glisse le long des obstacles et continue de suivre la hauteur des surfaces praticables.
- Les ressources récoltées cessent immédiatement de bloquer le passage ; les abris restent accessibles entre leurs poteaux.
