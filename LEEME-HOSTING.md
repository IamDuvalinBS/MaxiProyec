# Correr el bot en cualquier hosting

Comando de inicio en todos lados: `npm start` (Node 18 o superior; recomendado 20+).

1. Sube el proyecto (git, zip o panel de archivos) y corre `npm install`.
2. Define las variables de entorno en el panel del hosting, o crea un archivo `.env` junto a `index.js` (ver `.env.example`).
3. Primera vez: define `NUMERO_BOT` con el número a vincular (código de país, sin +). El código de vinculación sale en la consola y en la página del bot (`/`). Si el hosting tiene consola interactiva, también puedes escribir el número ahí.
4. El puerto se toma de `PORT` (lo asignan Railway, Render, Koyeb, etc.). `/health` responde `ok` para los chequeos de salud.

Notas
- Archivos del disco (`data/`, `auth_info/`) se pierden en hostings con disco temporal. Por eso conviene dejar `MONGO_URI` configurada: la sesión y los datos viven en MongoDB.
- `yt-dlp` y `ffmpeg` se instalan solos si el servidor lo permite (Termux usa `pkg`, Linux usa `pip`). En un hosting sin permisos, instala `ffmpeg` y `yt-dlp` por tu cuenta o define `FFMPEG_PATH`.
- Owners extra sin editar código: `GACHA_OWNERS`, `DUENOS_EXTRA`, `OWNERS_EXTRA` (números separados por coma).
- Si el hosting limita la memoria, el lanzador usa el 75% del límite; se puede forzar con `MAXI_RAM_MB`.
- Solo debe haber UNA copia encendida por sesión de WhatsApp (Termux y hosting a la vez provocan "sesión reemplazada").
