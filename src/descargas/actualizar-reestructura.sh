#!/usr/bin/env bash
# actualizar.sh: instala el .zip mas reciente de Descargas en el bot, aplica los
# scripts de parches que traiga, verifica que ningun archivo este roto y, de forma
# opcional, sube todo a GitHub.
#
#   bash actualizar.sh                 instala y verifica
#   bash actualizar.sh push            ademas hace git commit y git push
#   bash actualizar.sh archivo.zip     usa ese zip en lugar del mas reciente
#
# Variables opcionales: BOT_DIR, DESCARGAS_DIR, PATRON_ZIP (por defecto MaxiProyec-*.zip)
# Si algo falla, los cambios se revierten y el respaldo queda en .respaldo-actualizaciones/

BOT="${BOT_DIR:-$HOME/MaxiProyec}"
DESCARGAS="${DESCARGAS_DIR:-$HOME/storage/downloads}"
PATRON="${PATRON_ZIP:-MaxiProyec-*.zip}"

ARCHIVOS_PARCHADOS=(
  "index.js" "motores/db.js" "src/nucleo/comandos.js" "motores/gacha-core.js"
  "src/comandos/descargas/youtube.js" "scripts/verificar.mjs" ".gitignore"
)
PROHIBIDOS=("auth_info" "auth_info_" "node_modules" ".git" ".env" "cache" "data")

PUSH=0
ZIP=""
for argumento in "$@"; do
  case "$argumento" in
    push) PUSH=1 ;;
    *.zip) ZIP="$argumento" ;;
  esac
done

[ -d "$BOT" ] || { echo "❌ No se encuentra la carpeta del bot: $BOT (define BOT_DIR=/ruta)"; exit 1; }

if [ -z "$ZIP" ]; then
  [ -d "$DESCARGAS" ] || { echo "❌ Falta el permiso de almacenamiento. Ejecuta una vez: termux-setup-storage"; exit 1; }
  ZIP=$(ls -t "$DESCARGAS"/$PATRON 2>/dev/null | head -n1)
fi
[ -n "$ZIP" ] && [ -f "$ZIP" ] || { echo "❌ No hay ningún archivo $PATRON en $DESCARGAS."; exit 1; }
echo "📦 Usando: $ZIP"

unzip -tq "$ZIP" >/dev/null 2>&1 || { echo "❌ El zip está dañado o incompleto. Descárgalo nuevamente."; exit 1; }

if unzip -Z1 "$ZIP" | grep -qE '(^/|(^|/)\.\.(/|$))'; then
  echo "❌ El zip contiene rutas no permitidas. No se instaló nada."
  exit 1
fi

TMP=$(mktemp -d)
ERR=$(mktemp)
SALIDA=$(mktemp)
trap 'rm -rf "$TMP" "$ERR" "$SALIDA"' EXIT
unzip -oq "$ZIP" -d "$TMP" || { echo "❌ No se pudo extraer el zip."; exit 1; }

RAIZ_ZIP="$TMP"
CONTENIDO=("$TMP"/* "$TMP"/.[!.]*)
UNICOS=()
for e in "${CONTENIDO[@]}"; do [ -e "$e" ] && UNICOS+=("$e"); done
if [ "${#UNICOS[@]}" -eq 1 ] && [ -d "${UNICOS[0]}" ] && [ ! -e "$BOT/$(basename "${UNICOS[0]}")" ]; then
  RAIZ_ZIP="${UNICOS[0]}"
fi

for p in "${PROHIBIDOS[@]}"; do
  if [ -e "$RAIZ_ZIP/$p" ]; then
    echo "⚠️  Se omite $p por seguridad."
    rm -rf "$RAIZ_ZIP/$p"
  fi
done

MALOS=0
while IFS= read -r f; do
  if ! node --input-type=module --check < "$f" 2>"$ERR"; then
    echo "❌ Archivo con errores: ${f#$RAIZ_ZIP/}"; head -n 4 "$ERR"; MALOS=1
  fi
done < <(find "$RAIZ_ZIP" \( -name '*.js' -o -name '*.mjs' \))
[ "$MALOS" = 0 ] || { echo "⛔ No se instaló nada. Corrige el error de arriba."; exit 1; }

RESP="$BOT/.respaldo-actualizaciones/$(date +%Y%m%d-%H%M%S)"
NUEVOS="$TMP.nuevos"
: > "$NUEVOS"
trap 'rm -rf "$TMP" "$ERR" "$SALIDA" "$NUEVOS"' EXIT

respaldar() {
  local rel="$1"
  if [ -f "$BOT/$rel" ] && [ ! -f "$RESP/$rel" ]; then
    mkdir -p "$RESP/$(dirname "$rel")"
    cp "$BOT/$rel" "$RESP/$rel"
  fi
}

while IFS= read -r f; do
  rel="${f#$RAIZ_ZIP/}"
  if [ -f "$BOT/$rel" ]; then respaldar "$rel"; else echo "$rel" >> "$NUEVOS"; fi
done < <(find "$RAIZ_ZIP" -type f)
for rel in "${ARCHIVOS_PARCHADOS[@]}"; do respaldar "$rel"; done
echo "🗄️  Respaldo guardado en: $RESP"

revertir() {
  echo "↩️  Revirtiendo los cambios..."
  [ -d "$RESP" ] && cp -r "$RESP"/. "$BOT"/
  while IFS= read -r rel; do [ -n "$rel" ] && rm -f "$BOT/$rel"; done < "$NUEVOS"
  echo "✅ El bot quedó como estaba antes."
}

cp -r "$RAIZ_ZIP"/. "$BOT"/
N=$(find "$RAIZ_ZIP" -type f | wc -l)
echo "✅ Instalados $N archivos en $BOT"

cd "$BOT" || exit 1

while IFS= read -r script; do
  [ -n "$script" ] || continue
  echo "🔧 Ejecutando $script"
  node "$script" > "$SALIDA" 2>&1
  grep -E '^(APLICADO|NO ENCONTRADO)' "$SALIDA" | sed 's/^/   /'
done < <(cd "$RAIZ_ZIP" && find scripts -maxdepth 1 -name 'aplicar-parches*.mjs' 2>/dev/null | sort)

if [ -f "$BOT/scripts/verificar.mjs" ]; then
  node scripts/verificar.mjs > "$SALIDA" 2>&1
  if grep -q '^Sintaxis inválida' "$SALIDA"; then
    grep -A3 '^Sintaxis inválida' "$SALIDA" | head -n 12
    revertir
    exit 1
  fi
  PROBLEMAS=$(grep -cE '^Import inexistente' "$SALIDA")
  if [ "$PROBLEMAS" -gt 0 ]; then
    echo "⚠️  Verificación: $PROBLEMAS import(s) inexistente(s):"
    grep '^Import inexistente' "$SALIDA" | head -n 5 | sed 's/^/   /'
  else
    echo "✅ Verificación sin problemas."
  fi
fi

if [ -f "$RAIZ_ZIP/package.json" ]; then
  echo "📦 Instalando dependencias..."
  if ! npm install; then
    echo "⚠️  npm install tuvo conflictos. Reintentando con --legacy-peer-deps..."
    npm install --legacy-peer-deps || { echo "❌ Las dependencias no se pudieron instalar."; exit 1; }
  fi
  echo "✅ Dependencias listas."
fi

touch "$BOT/.gitignore"
for linea in "node_modules/" "auth_info/" "auth_info_/" ".respaldo-*/" "*.log" "data/gacha.db*" "data/owners-gacha.txt" "cache/"; do
  grep -qxF "$linea" "$BOT/.gitignore" || echo "$linea" >> "$BOT/.gitignore"
done

if [ "$PUSH" = 1 ]; then
  git add -A
  if git diff --cached --quiet; then
    echo "ℹ️ No hay cambios nuevos para subir."
  else
    git commit -qm "Actualización ($(date +%F))"
    if git push; then
      echo "🚀 Subido a GitHub."
    else
      echo "⚠️ El push fue rechazado (hay commits en GitHub que no existen localmente)."
      echo "   Opción A (traer esos cambios primero):  git pull --rebase && git push"
      echo "   Opción B (la copia local reemplaza a GitHub):  git push --force"
    fi
  fi
fi

echo "🔁 Reinicia el bot (npm start) para que cargue los cambios."
