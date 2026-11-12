// Measures each narration clip and writes audio/durations.json, which capture.mjs reads.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import ffprobe from "ffprobe-static";

const out = {};
for (const f of fs.readdirSync("audio").filter((x) => x.endsWith(".mp3"))) {
  out[f.replace(".mp3", "")] = parseFloat(
    execFileSync(ffprobe.path, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `audio/${f}`]).toString(),
  );
}
fs.writeFileSync("audio/durations.json", JSON.stringify(out, null, 1));
console.log(out);
