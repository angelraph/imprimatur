// Edits the captured scenes into the final video: transitions, captions, voiceover.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpeg from "ffmpeg-static";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "demo");
fs.mkdirSync(OUT, { recursive: true });
const tl = JSON.parse(fs.readFileSync(path.join(HERE, "timeline.json"), "utf8"));
const scenes = JSON.parse(fs.readFileSync(path.join(HERE, "scenes.json"), "utf8"));
const { T, LEAD, FPS, order } = tl;

// Clip lengths come from the frames actually captured.
const frames = Object.fromEntries(order.map((id) => [id, fs.readdirSync(path.join(HERE, "frames", id)).filter((f) => f.endsWith(".jpg")).length]));
const D = Object.fromEntries(order.map((id) => [id, frames[id] / FPS]));
const start = {};
let t = 0;
for (const id of order) { start[id] = t; t += D[id] - T; }
const total = t + T;

const audioStart = (id) => (id === "s08-resit" ? start["s08a-declined"] : start[id]) + LEAD;

// ---------- Captions ----------
const show = (s) => s.replace(/\bServ Reasoning\b/g, "SERV Reasoning").replace(/x four oh two/g, "x402");
const cues = [];
for (const s of scenes) {
  const words = JSON.parse(fs.readFileSync(path.join(HERE, "audio", `${s.id}.words.json`), "utf8"));
  const tokens = s.text.split(/\s+/);
  const timeOf = (i) => (tokens.length === words.length ? words[Math.min(i, words.length - 1)].t : (i / tokens.length) * (words[words.length - 1].t + words[words.length - 1].d));
  if (tokens.length !== words.length) console.log("note:", s.id, "tokens", tokens.length, "words", words.length, "(proportional timing)");
  // Break into lines at punctuation, keeping each line short enough to read.
  const lines = [];
  let cur = [], curStart = 0;
  const flush = (i) => { if (cur.length) { lines.push({ from: curStart, text: cur.join(" ") }); cur = []; curStart = i; } };
  tokens.forEach((tok, i) => {
    if (!cur.length) curStart = i;
    cur.push(tok);
    const len = cur.join(" ").length;
    const end = /[.!?]$/.test(tok), soft = /[,:;]$/.test(tok);
    if (end || (soft && len > 26) || len > 46) flush(i + 1);
  });
  flush(tokens.length);
  // Join a very short tail onto the line before it.
  for (let i = lines.length - 1; i > 0; i--) {
    if (lines[i].text.length < 12 && (lines[i - 1].text + " " + lines[i].text).length <= 58 && !/[.!?]$/.test(lines[i - 1].text)) { lines[i - 1].text += " " + lines[i].text; lines.splice(i, 1); }
  }
  const a0 = audioStart(s.id);
  const last = words[words.length - 1];
  lines.forEach((ln, i) => {
    const from = a0 + timeOf(ln.from) - 0.06;
    const to = i + 1 < lines.length ? a0 + timeOf(lines[i + 1].from) - 0.08 : a0 + last.t + last.d + 0.35;
    cues.push({ from: Math.max(0, from), to, text: show(ln.text) });
  });
}
const ts = (x, sep) => { const h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), s = x % 60; return sep === "," ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${s.toFixed(3).padStart(6, "0").replace(".", ",")}` : `${h}:${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`; };
const ass = [
  "[Script Info]", "ScriptType: v4.00+", "PlayResX: 1920", "PlayResY: 1080", "WrapStyle: 2", "ScaledBorderAndShadow: yes", "",
  "[V4+ Styles]",
  "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
  "Style: Cap,Segoe UI Semibold,40,&H00F7F5F5,&H00F7F5F5,&H0C1E1717,&H0C1E1717,0,0,0,0,100,100,0.2,0,3,14,0,2,120,120,40,1", "",
  "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ...cues.map((c) => `Dialogue: 0,${ts(c.from)},${ts(c.to)},Cap,,0,0,0,,{\\fad(140,120)}${c.text}`),
].join("\n");
fs.writeFileSync(path.join(HERE, "captions.ass"), ass, "utf8");
fs.writeFileSync(path.join(OUT, "imprimatur-demo.srt"), cues.map((c, i) => `${i + 1}\n${ts(c.from, ",")} --> ${ts(c.to, ",")}\n${c.text}\n`).join("\n"), "utf8");
const titles = { "s01-intro": "Intro", "s02-landing": "The idea", "s03-sit": "The exam room", "s04-licence": "The licence", "s05-reppo": "The outside examiner", "s06-kite": "Enforced by Kite", "s07-cases": "The record", "s08-resit": "Feedback that proves itself", "s09-verify": "Verify a licence", "s10-registry": "The public registry", "s11-outro": "Close" };
const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
fs.writeFileSync(
  path.join(OUT, "transcript.md"),
  ["# Imprimatur demo: transcript", "", `Length ${mmss(total)}. Narration by a synthetic voice. Every page shown is the live site at https://imprimatur-delta.vercel.app`, "",
    ...scenes.flatMap((s) => [`## ${mmss(audioStart(s.id))} ${titles[s.id]}`, "", show(s.text), ""])].join("\n"),
  "utf8",
);

// ---------- Video and audio ----------
const TRANS = { "s02-landing": "fade", "s03-sit": "smoothleft", "s04-licence": "smoothleft", "s05-reppo": "fade", "s06-kite": "fade", "s07-cases": "fade", "s08a-declined": "smoothleft", "s08b-resit": "smoothleft", "s09-verify": "smoothleft", "s10-registry": "smoothup", "s11-outro": "fade" };
const args = ["-y", "-loglevel", "error", "-stats"];
for (const id of order) args.push("-framerate", String(FPS), "-i", `frames/${id}/%05d.jpg`);
for (const s of scenes) args.push("-i", `audio/${s.id}.mp3`);
const fc = [];
order.forEach((id, i) => fc.push(`[${i}:v]scale=1920:1080:flags=lanczos,format=yuv420p,setsar=1,fps=${FPS}[v${i}]`));
let prev = "v0";
order.forEach((id, i) => {
  if (i === 0) return;
  const out = `x${i}`;
  fc.push(`[${prev}][v${i}]xfade=transition=${TRANS[id]}:duration=${T}:offset=${start[id].toFixed(3)}[${out}]`);
  prev = out;
});
fc.push(`[${prev}]subtitles=captions.ass,fade=t=in:st=0:d=0.5,fade=t=out:st=${(total - 0.7).toFixed(3)}:d=0.7[vout]`);
scenes.forEach((s, i) => {
  const ms = Math.round(audioStart(s.id) * 1000);
  fc.push(`[${order.length + i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms}[a${i}]`);
});
fc.push(`${scenes.map((_, i) => `[a${i}]`).join("")}amix=inputs=${scenes.length}:normalize=0:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11,apad[aout]`);
args.push("-filter_complex", fc.join(";"), "-map", "[vout]", "-map", "[aout]", "-t", total.toFixed(3),
  "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart",
  path.join(OUT, "imprimatur-demo.mp4"));
console.log("total", total.toFixed(2), "s; cues", cues.length);
execFileSync(ffmpeg, args, { cwd: HERE, stdio: "inherit" });
fs.writeFileSync(path.join(HERE, "final-timeline.json"), JSON.stringify({ total, start, D, cues: cues.length }, null, 1));
console.log("wrote", path.join(OUT, "imprimatur-demo.mp4"), (fs.statSync(path.join(OUT, "imprimatur-demo.mp4")).size / 1e6).toFixed(1), "MB");
