// Contact sheet: six evenly spaced frames of a scene (or of the final video) tiled 3x2.
// Usage: node sheet.mjs <sceneId ...>
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpeg from "ffmpeg-static";
const HERE = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(path.join(HERE, "sheets"), { recursive: true });
for (const id of process.argv.slice(2)) {
  const dir = path.join(HERE, "frames", id);
  const n = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).length;
  const picks = [0.08, 0.26, 0.44, 0.62, 0.8, 0.97].map((p) => Math.max(1, Math.min(n, Math.round(n * p))));
  const args = ["-y", "-loglevel", "error"];
  for (const p of picks) args.push("-i", path.join(dir, String(p).padStart(5, "0") + ".jpg"));
  args.push("-filter_complex", picks.map((_, i) => `[${i}:v]scale=960:540[v${i}]`).join(";") + ";" + picks.map((_, i) => `[v${i}]`).join("") + "xstack=inputs=6:layout=0_0|960_0|0_540|960_540|0_1080|960_1080[o]", "-map", "[o]", "-q:v", "3", path.join(HERE, "sheets", id + ".jpg"));
  execFileSync(ffmpeg, args);
  console.log(id, "frames", picks.join(","));
}
