import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";

export function correrFfmpeg(args, timeout = 120000) {
  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      ["-nostdin", "-y", "-v", "error", ...args],
      { timeout, maxBuffer: 8 * 1024 * 1024 },
      (error, _salida, errores) => {
        if (!error) return resolve();
        if (error.code === "ENOENT") return reject(new Error("ffmpeg no está instalado"));
        const detalle = String(errores || error.message).trim().split("\n").slice(-2).join(" ");
        reject(new Error(detalle));
      }
    );
  });
}

export async function conTemporal(prefijo, trabajo) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), prefijo + "-"));
  try {
    return await trabajo(dir);
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
