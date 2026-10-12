#!/usr/bin/env bash
# Construit dist/<skill>.zip pour chaque skill de skills/ : l'archive à importer dans claude.ai
# (Personnaliser > Skills > Importer) ou à décompresser dans ~/.claude/skills/.
#
#   ./outils/empaqueter.sh
#
# Les dépendances installées, les rendus et les fichiers audio générés ne sont jamais inclus.
set -euo pipefail

racine="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$racine/dist"
cd "$racine/skills"

for dossier in */; do
  nom="${dossier%/}"
  [ -f "$nom/SKILL.md" ] || continue
  archive="$racine/dist/$nom.zip"
  rm -f "$archive"
  zip -qrX "$archive" "$nom" -x "*/node_modules/*" "*/out/*" "*.wav" "*/.DS_Store"
  echo "$(du -h "$archive" | cut -f1)  dist/$nom.zip"
done
