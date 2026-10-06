#!/usr/bin/env bash
# actualizar.sh — instala el último gacha-*.zip de Descargas en tu bot, lo verifica y (opcional) lo sube a GitHub.
#
#   bash actualizar.sh         instala y verifica
#   bash actualizar.sh push    además hace git commit + git push
#
# Antes de tocar nada comprueba que el zip esté sano y que ningún .js venga cortado; si algo falla,
# NO instala nada. Los archivos que reemplaza los guarda en .respaldo-gacha/ por si querés volver atrás.

BOT="${BOT_DIR:-$HOME/MaxiProyec}"
DESCARGAS="$HOME/storage/downloads"

[ -d "$BOT" ] || { echo "❌ No encuentro la carpeta del bot: $BOT (definí BOT_DIR=/ruta)"; exit 1; }
[ -d "$DESCARGAS" ] || { echo "❌ Falta el permiso de almacenamiento. Ejecutá una vez: termux-setup-storage"; exit 1; }

ZIP=$(ls -t "$DESCARGAS"/gacha-*.zip 2>/dev/null | head -n1)
[ -n "$ZIP" ] || { echo "❌ No hay ningún gacha-*.zip en Descargas."; exit 1; }
echo "📦 Usando: $ZIP"

unzip -tq "$ZIP" >/dev/null 2>&1 || { echo "❌ El zip está dañado o incompleto. Volvé a descargarlo."; exit 1; }

TMP=$(mktemp -d)
ERR=$(mktemp)
trap 'rm -rf "$TMP" "$ERR"' EXIT
unzip -oq "$ZIP" -d "$TMP" || { echo "❌ No pude extraer el zip."; exit 1; }

# 1) Verificar integridad: cada archivo debe coincidir con el manifiesto del zip (detecta archivos cortados
#    o alterados) y además tener sintaxis válida. Si algo falla, no se instala nada.
MALOS=0
if [ -f "$TMP/gacha-manifiesto.sha256" ]; then
  if ! (cd "$TMP" && sha256sum -c gacha-manifiesto.sha256 --quiet 2>&1); then
    echo "❌ Hay archivos que no coinciden con el manifiesto (cortados o alterados)."; MALOS=1
  fi
  rm -f "$TMP/gacha-manifiesto.sha256"
else
  echo "⚠️ El zip no trae manifiesto; solo verifico la sintaxis."
fi
while IFS= read -r f; do
  if ! node --input-type=module --check < "$f" 2>"$ERR"; then
    echo "❌ Archivo con errores: ${f#$TMP/}"; head -n 4 "$ERR"; MALOS=1
  fi
done < <(find "$TMP" -name '*.js')
[ "$MALOS" = 0 ] || { echo "⛔ No se instaló nada. Volvé a descargar el zip."; exit 1; }

# 2) Respaldo de lo que se va a reemplazar.
RESP="$BOT/.respaldo-gacha/$(date +%Y%m%d-%H%M%S)"
while IFS= read -r f; do
  rel="${f#$TMP/}"
  if [ -f "$BOT/$rel" ]; then mkdir -p "$RESP/$(dirname "$rel")"; cp "$BOT/$rel" "$RESP/$rel"; fi
done < <(find "$TMP" -type f)

# 3) Instalar.
cp -r "$TMP"/. "$BOT"/
N=$(find "$TMP" -type f | wc -l)
echo "✅ Instalados $N archivos en $BOT"

# 4) Que git no suba respaldos ni la base de datos del gacha.
touch "$BOT/.gitignore"
for linea in ".respaldo-gacha/" "data/gacha.db*" "data/owners-gacha.txt"; do
  grep -qxF "$linea" "$BOT/.gitignore" || echo "$linea" >> "$BOT/.gitignore"
done

# 5) Subir a GitHub (solo si pedís "push").
if [ "$1" = "push" ]; then
  cd "$BOT" || exit 1
  git add .gitignore motores src
  if git diff --cached --quiet; then
    echo "ℹ️ No hay cambios nuevos para subir."
  else
    git commit -qm "gacha: actualización $(date +%F)" && git push && echo "🚀 Subido a GitHub." || echo "⚠️ No pude hacer push (revisá tu sesión/token de GitHub)."
  fi
fi

echo "🔁 Reiniciá el bot para que cargue los cambios."
