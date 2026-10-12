# Journal des modifications

Toutes les évolutions notables des skills de ce dépôt. Les versions suivent le [versionnage sémantique](https://semver.org/lang/fr/) : un changement de la recette qui modifie le rendu des vidéos existantes augmente la version mineure, une correction augmente la version de correctif.

## dashboard-cinematique 1.0.0 (12 octobre 2026)

Première version publique.

**Image**
- Interface filmée en macro sur un plan 3D incliné : 5 cadrages testés (KPI, courbe, chiffre d'alerte, barres, barre du haut).
- Texte net à tous les zooms grâce au sur-échantillonnage du plan 3D.
- Profondeur de champ progressive sur 3 niveaux, avec le lointain et le premier plan qui tombent dans l'ombre.
- Lumière limitée aux accents néon, avec un halo sobre réglé à l'échelle du gros plan. Aucun faisceau ni rayon ajouté.
- Transitions en coupe franche sans passage par le noir, caméra en mouvement continu, animations lancées avant la coupe.
- Fin « recul » sur l'interface entière, sans logo par défaut. Fins « barre » et « aucune » disponibles, ainsi qu'un logo optionnel (tracé à la comète ou révélé).

**Son**
- Musique originale générée sans dépendance : un accord tenu, basse profonde, nappe large, motif en doubles-croches, arrangement qui monte plan après plan.
- Effets sonores musicaux calés à l'image (montée, arpège, souffle, impact) et révélation finale : souffle inversé, arrêt de la musique, impact, traîne.
- Mode « effets sonores seuls » pour utiliser la musique du client ou un son tendance sur les réseaux sociaux.

**Outils**
- Création d'un projet en une commande (`scripts/nouveau-projet.mjs`).
- Planche-contact (`planche.mjs`) et contrôle automatique de la fluidité (`controle.mjs`) : images ratées, plongées au noir, plans figés.
- Garde-fous sur le montage dans le générateur de son.

**Distribution**
- Catalogue de plugins Claude Code (`motion-design@motion-design-skills`).
- Archive prête à importer dans claude.ai (`dist/dashboard-cinematique.zip`).
- Guides d'installation, d'utilisation et de dépannage, modèles de prompts.
