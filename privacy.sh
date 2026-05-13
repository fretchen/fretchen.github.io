#!/bin/bash
# Skript: Ersetzt "Fred Jendrzejewski" durch "fretchen" im gesamten Repo
# Führe dieses Skript im Root-Verzeichnis deines geklonten Repos aus.

set -e

REPO_DIR="${1:-.}"
cd "$REPO_DIR"

echo "🔍 Suche nach 'Fred Jendrzejewski' ..."
COUNT=$(grep -rn "Fred Jendrzejewski" . --exclude-dir=.git --exclude-dir=node_modules | wc -l)
echo "   Gefunden: $COUNT Vorkommen"

# .mdx, .md, .ipynb, .tex, .json, .yaml, .yml, .js, .ts, .tsx
find . -not -path './.git/*' -not -path '*/node_modules/*' \( \
  -name "*.mdx" -o -name "*.md" -o -name "*.ipynb" -o -name "*.tex" \
  -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" \
  -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" \
\) -exec grep -l "Fred Jendrzejewski" {} \; | while read f; do
  sed -i 's/Fred Jendrzejewski/fretchen/g' "$f"
  echo "   ✅ $f"
done

REMAINING=$(grep -rn "Fred Jendrzejewski" . --exclude-dir=.git --exclude-dir=node_modules | wc -l || true)
echo ""
if [ "$REMAINING" -eq 0 ]; then
  echo "✅ Alle Vorkommen ersetzt!"
else
  echo "⚠️  Noch $REMAINING Vorkommen übrig – bitte manuell prüfen."
  grep -rn "Fred Jendrzejewski" . --exclude-dir=.git --exclude-dir=node_modules
fi

echo ""
echo "📋 Geänderte Dateien:"
git diff --stat

echo ""
echo "💡 Nächster Schritt: commit & push"
echo "   git add -A"
echo "   git commit -m 'privacy: replace real name with fretchen pseudonym'"
echo "   git push"