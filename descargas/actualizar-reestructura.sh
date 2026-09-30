#!/usr/bin/env bash
# actualizar-reestructura.sh — instala el MaxiProyec-reestructurado.zip mas
# reciente de Descargas, borra lo que quedo obsoleto por la reorganizacion,
# revisa que ningun .js este roto, instala paquetes nuevos y (opcional) sube
# todo a GitHub.
#
#   bash actualizar-reestructura.sh          instala y verifica
#   bash actualizar-reestructura.sh push     ademas hace git commit + git push
#
# Si algo sale mal a mitad de camino, no te quedas sin bot: el respaldo
# queda en .respaldo-reestructura/<fecha>/ dentro de la carpeta del bot.

BOT="${BOT_DIR:-$HOME/MaxiProyec}"
DESCARGAS="$HOME/storage/downloads"

# Carpetas/archivos que la reestructuracion dejo obsoletos: si siguen ahi,
# el loader de comandos los vuelve a leer y quedan duplicados o rotos.
OBSOLETOS=(
  "commands" "bot" "economia.js" "motores/work.js" "motores/trivia.js"
  "descargas" "reacciones" "perfil" "motores/reactions.js" "motores/ig.js"
  "motores/espera-formato.js"
)

[ -d "$BOT" ] || { echo "❌ No encuentro la carpeta del bot: $BOT (definí BOT_DIR=/ruta)"; exit 1; }
[ -d "$DESCARGAS" ] || { echo "❌ Falta el permiso de almacenamiento. Ejecutá una vez: termux-setup-storage"; exit 1; }

ZIP=$(ls -t "$DESCARGAS"/MaxiProyec-reestructurado*.zip 2>/dev/null | head -n1)
[ -n "$ZIP" ] || { echo "❌ No hay ningún MaxiProyec-reestructurado*.zip en Descargas."; exit 1; }
echo "📦 Usando: $ZIP"

unzip -tq "$ZIP" >/dev/null 2>&1 || { echo "❌ El zip está dañado o incompleto. Volvé a descargarlo."; exit 1; }

TMP=$(mktemp -d)
ERR=$(mktemp)
trap 'rm -rf "$TMP" "$ERR"' EXIT
unzip -oq "$ZIP" -d "$TMP" || { echo "❌ No pude extraer el zip."; exit 1; }

# 1) Verificar sintaxis de cada .js ANTES de instalar nada. Si uno solo
#    esta roto, se cancela todo (mejor eso que un bot que no arranca).
MALOS=0
while IFS= read -r f; do
  if ! node --input-type=module --check < "$f" 2>"$ERR"; then
    echo "❌ Archivo con errores: ${f#$TMP/}"; head -n 4 "$ERR"; MALOS=1
  fi
done < <(find "$TMP" -name '*.js')
[ "$MALOS" = 0 ] || { echo "⛔ No se instaló nada. Avisame el error de arriba."; exit 1; }

# 2) Respaldo de lo que se va a reemplazar Y de lo que se va a borrar.
RESP="$BOT/.respaldo-reestructura/$(date +%Y%m%d-%H%M%S)"
while IFS= read -r f; do
  rel="${f#$TMP/}"
  if [ -f "$BOT/$rel" ]; then mkdir -p "$RESP/$(dirname "$rel")"; cp "$BOT/$rel" "$RESP/$rel"; fi
done < <(find "$TMP" -type f)
for o in "${OBSOLETOS[@]}"; do
  [ -e "$BOT/$o" ] && { mkdir -p "$RESP/$(dirname "$o")"; cp -r "$BOT/$o" "$RESP/$o" 2>/dev/null; }
done
echo "🗄️  Respaldo guardado en: $RESP"

# 3) Borrar lo obsoleto, despues instalar lo nuevo encima.
for o in "${OBSOLETOS[@]}"; do
  rm -rf "$BOT/$o"
done
cp -r "$TMP"/. "$BOT"/
N=$(find "$TMP" -type f | wc -l)
echo "✅ Instalados $N archivos en $BOT"

# 4) Paquetes nuevos (ej: sharp, para las miniaturas del menu/reacciones).
cd "$BOT" || exit 1
echo "📦 Instalando dependencias..."
if ! npm install; then
  echo "⚠️  npm install tuvo conflictos. Reintentando con --legacy-peer-deps..."
  if ! npm install --legacy-peer-deps; then
    echo "❌ Sigue sin resolverse. Probá borrar node_modules y package-lock.json:"
    echo "   rm -rf node_modules package-lock.json && npm install"
    exit 1
  fi
fi
echo "✅ Dependencias listas."

# 5) Que git no suba respaldos ni la sesion de WhatsApp.
touch "$BOT/.gitignore"
for linea in "node_modules/" "auth_info/" "auth_info_/" ".respaldo-reestructura/" "*.log" "data/gacha.db*" "data/owners-gacha.txt"; do
  grep -qxF "$linea" "$BOT/.gitignore" || echo "$linea" >> "$BOT/.gitignore"
done

# 6) Subir a GitHub (solo si pedís "push").
if [ "$1" = "push" ]; then
  git add -A
  if git diff --cached --quiet; then
    echo "ℹ️ No hay cambios nuevos para subir."
  else
    git commit -qm "Reestructuración: descargas, reacciones, perfil, economía ($(date +%F))"
    if git push; then
      echo "🚀 Subido a GitHub."
    else
      echo "⚠️ El push fue rechazado (hay commits en GitHub que no tenés local)."
      echo "   Opción A (traer esos cambios primero):  git pull --rebase && git push"
      echo "   Opción B (tu copia local manda, pisa lo de GitHub):  git push --force"
    fi
  fi
fi

echo "🔁 Reiniciá el bot (npm start) para que cargue los cambios."
