import { startTime } from "./db.js";

export function formatTime(ms) {
  const seg = Math.ceil(ms / 1000);
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatUptime() {
  const seg = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  return `${h}h ${m}m ${s}s`;
}

export function box(titulo, lineas) {
  return [
    "╔╼┉✦┉╍✦┉╍✦┉╍✦┉╍✦╼⧽⧽",
    `┋✿ *${titulo}*`,
    "┋",
    ...lineas.map(l => `┋ ${l}`),
    "┋",
    "╰╼┉✦┉╍✦┉╍✦┉╍✦┉╍✦┉╼⧽⧽"
  ].join("\n");
}

export const commandRegistry = new Map();
