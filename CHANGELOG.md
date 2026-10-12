# Journal des modifications

Toutes les évolutions notables des skills de ce dépôt. Les versions suivent le [versionnage sémantique](https://semver.org/lang/fr/) : un changement de la recette qui modifie le rendu des vidéos existantes augmente la version mineure, une correction augmente la version de correctif.

## dashboard-cinematique 1.2.0 (12 octobre 2026)

Effets sonores calés sur les animations et musique plus percutante.

**Effets calés à l'image**
- Nouveau `scripts/reperage.mjs` : lit le brouillon image par image et repère tout ce qui s'allume (courbe tracée, barre qui pousse, bouton qui apparaît). Écarte la dérive de la caméra et les teintes qui tournent.
- La bande-son pose un effet par événement repéré, attaque sur la première image de l'animation, enveloppe qui suit sa courbe mesurée. Trois tailles : coup sourd + accord qui s'ouvre (grand), note qui monte d'une barre à l'autre (moyen), tic (petit).
- La musique se creuse sous chaque effet (-4,5 à -1,5 dB) : on entend l'effet tomber pile sur l'image.
- Le repérage porte une empreinte de l'interface et du montage : un repérage périmé est ignoré et signalé.
- Cause corrigée : les animations sont très rapides (courbe tracée en 6 images) alors que l'ancienne « montée » durait 30 images, et les effets étaient 4 à 26 dB sous la musique. Mesuré désormais : attaques à moins d'une image, grands effets 4 à 8 dB au-dessus de la musique.

**Musique plus percutante**
- Grosse caisse sur les 4 temps dès le 2e plan, attaque plus marquée ; frappe (claquement + caisse claire) et charleston dès le 3e plan.
- Basse saturée, en doubles-croches dès le 3e plan.
- Frappe « braam » sur chaque coupe, en plus du coup grave.
- Mastering plus fort (-14,5 dBFS RMS) ; similarité aux références 0,834 (seuil 0,80).

**Outils** : `scripts/sonorise.mjs` (pose la bande-son sur un brouillon sans refaire le rendu) ; scripts npm `brouillon`, `reperage`, `sonorise`, `controle`.

## dashboard-cinematique 1.1.0 (12 octobre 2026)

Bande-son entièrement refaite. La version 1.0 respectait les mesures des références (spectre, niveaux, accords) mais sonnait « cheap » : un modèle d'écoute (YAMNet) l'entendait comme une harpe, un clavecin, une musique de jeu vidéo, et la révélation comme un « ding » de musique pour enfants.

**Son**
- Nouveau moteur audio : oscillateurs sans repliement, filtre « échelle » de synthé analogique, réverbération de salle (réseau de 8 lignes), compression de bus.
- La musique est calée sur le montage : chaque plan est une mesure dont le premier temps tombe sur la coupe, l'accord change sur la coupe (pédale de tonique, i – VI – iv – VII – v sus → i).
- Palette de musique de film électronique : sub, basse pulsée filtrée, nappe sombre avec texture de chœur, arpège grave et doux, grosse caisse et claquements feutrés. Plus aucun son pincé ni clochette.
- Effets de cinéma placés automatiquement : ping de sonar à l'ouverture, souffle inversé et coup grave sur chaque coupe, grondement qui monte jusqu'à la révélation, explosion sourde, whoosh, battements.
- Effets plan par plan calés sur l'animation : `montee` (courbe), `impulsions` (une note par barre, `ecart` et `nombre`), `whoosh`, `impact`, `ping`.
- Volume presque constant d'un plan à l'autre (+3 dB du premier au dernier), comme les références : le premier plan n'est plus trop faible.
- Dosage des couches réglable dans `montage.json` (`musique.reglages`).

**Outils**
- `scripts/ecoute.py` (facultatif, Python) : compare la bande-son aux références avec YAMNet et signale les sons lus de travers. Nouvelle bande-son 0,875 de similarité, ancienne 0,69, références entre elles 0,65–0,85.

**Compatibilité** : les montages 1.0 restent valides. `arpege` est lu comme `impulsions`, et `bpm` fixe désormais le nombre de mesures par plan (le tempo réel suit les coupes).

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
