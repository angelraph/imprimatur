// Captures the walkthrough frame by frame from the live site.
// Every frame is a real screenshot of the real page; motion (scroll, cursor, spotlight) is driven per frame
// so the result is smooth at 30 fps regardless of how long a screenshot takes.
// Usage: node capture.mjs [sceneId ...]
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = "https://imprimatur-delta.vercel.app";
const FPS = 30;
export const T = 0.6; // transition overlap between clips
export const LEAD = 0.8; // silence before the voice in each scene
export const TAIL = 0.5;
const LIC_A = "IMP-261112-45BE38";
const LIC_DECLINED = "IMP-261112-43226E";
const LIC_RESIT = "IMP-261112-5E11EE";

const scenes = JSON.parse(fs.readFileSync(path.join(HERE, "scenes.json"), "utf8"));
const durations = JSON.parse(fs.readFileSync(path.join(HERE, "audio", "durations.json"), "utf8"));
const words = Object.fromEntries(scenes.map((s) => [s.id, JSON.parse(fs.readFileSync(path.join(HERE, "audio", `${s.id}.words.json`), "utf8"))]));
const A = (id) => durations[id];
// Audio time of the nth word starting with `w` in a scene's narration.
const wraw = (id, w, nth = 0) => {
  const norm = (x) => x.w.toLowerCase().replace(/[^a-z0-9]/g, "");
  const exact = words[id].filter((x) => norm(x) === w.toLowerCase());
  const hits = exact.length ? exact : words[id].filter((x) => norm(x).startsWith(w.toLowerCase()));
  if (!hits[nth]) throw new Error(`word "${w}" #${nth} not in ${id}`);
  return hits[nth].t;
};

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const io = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const out3 = (x) => 1 - Math.pow(1 - clamp(x), 3);
const lerp = (a, b, p) => a + (b - a) * p;

// Runs inside every page: the cursor, spotlight, click ripple and chapter chip.
const OVERLAY = () => {
  const css = `
    html { scroll-behavior: auto !important; }
    ::-webkit-scrollbar { display: none !important; }
    #__demo { position: fixed; inset: 0; z-index: 2147483647; pointer-events: none; font-family: Manrope, "Segoe UI", system-ui, sans-serif; }
    #__demo * { position: absolute; }
    #__spot { border-radius: 14px; box-shadow: 0 0 0 4000px rgba(4,4,8,.62), 0 0 0 2px rgba(143,115,255,.95), 0 0 34px 4px rgba(143,115,255,.45); opacity: 0; }
    #__ripple { width: 56px; height: 56px; margin: -28px 0 0 -28px; border-radius: 50%; border: 2px solid rgba(143,115,255,.95); background: rgba(143,115,255,.22); opacity: 0; }
    #__cursor { width: 30px; height: 30px; opacity: 0; filter: drop-shadow(0 3px 6px rgba(0,0,0,.55)); }
    #__chip { left: 20px; bottom: 112px; display: flex; align-items: center; gap: 12px; padding: 10px 18px 10px 12px; border-radius: 999px;
      background: rgba(17,17,22,.92); border: 1px solid rgba(143,115,255,.5); color: #f5f5f7; font-size: 15px; font-weight: 600; letter-spacing: -.005em;
      box-shadow: 0 10px 34px rgba(0,0,0,.5); opacity: 0; white-space: nowrap; }
    #__chip b { position: static; display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 26px; padding: 0 8px; border-radius: 999px;
      background: #8f73ff; color: #0b0b10; font: 600 12px "IBM Plex Mono", ui-monospace, monospace; letter-spacing: .04em; }
    #__chip span { position: static; }
  `;
  const ensure = () => {
    if (document.getElementById("__demo") || !document.body) return !!document.body;
    const st = document.createElement("style");
    st.id = "__demo_css";
    st.textContent = css;
    document.head.appendChild(st);
    const root = document.createElement("div");
    root.id = "__demo";
    root.innerHTML =
      '<div id="__spot"></div><div id="__chip"><b></b><span></span></div><div id="__ripple"></div>' +
      '<svg id="__cursor" viewBox="0 0 30 30"><path d="M5 3 L5 24 L10.6 19 L14.4 27.4 L18.2 25.7 L14.5 17.5 L22 17.2 Z" fill="#fff" stroke="#0b0b10" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(root);
    return true;
  };
  window.__demoSet = (s) => {
    if (!ensure()) return;
    const q = (id) => document.getElementById(id);
    const c = q("__cursor");
    c.style.opacity = s.cursor.o;
    c.style.transform = `translate(${s.cursor.x - 5}px, ${s.cursor.y - 3}px) scale(${s.cursor.s})`;
    const sp = q("__spot");
    sp.style.opacity = s.spot.o;
    sp.style.left = s.spot.x + "px"; sp.style.top = s.spot.y + "px"; sp.style.width = s.spot.w + "px"; sp.style.height = s.spot.h + "px";
    const r = q("__ripple");
    r.style.left = s.ripple.x + "px"; r.style.top = s.ripple.y + "px";
    r.style.opacity = s.ripple.p > 0 && s.ripple.p < 1 ? 1 - s.ripple.p : 0;
    r.style.transform = `scale(${0.35 + s.ripple.p * 1.1})`;
    const ch = q("__chip");
    ch.children[0].textContent = s.chip.n; ch.children[1].textContent = s.chip.text;
    ch.style.opacity = s.chip.p;
    ch.style.transform = `translateX(${-(1 - s.chip.p) * 60}px)`;
  };
  document.addEventListener("DOMContentLoaded", ensure);
};

class Stage {
  constructor(page) {
    this.page = page;
    this.state = { cursor: { x: 720, y: 430, o: 0, s: 1 }, spot: { x: 0, y: 0, w: 0, h: 0, o: 0 }, ripple: { x: 0, y: 0, p: 0 }, chip: { n: "", text: "", p: 0 } };
    this.scrollY = 0;
  }
  begin(id, D) {
    this.id = id; this.D = D; this.n = 0; this.total = Math.round(D * FPS);
    this.dir = path.join(HERE, "frames", id);
    fs.rmSync(this.dir, { recursive: true, force: true });
    fs.mkdirSync(this.dir, { recursive: true });
    this.last = null; this.dirty = true; this.chipDef = null; this.shots = 0;
    this.state.ripple.p = 0;
  }
  get t() { return this.n / FPS; }
  chip(n, text, from = 0.45, to = 4.4) { this.chipDef = { n, text, from, to }; }
  async tick(live = false) {
    if (this.n >= this.total) return false;
    if (this.chipDef) {
      const { n, text, from, to } = this.chipDef;
      const p = Math.min(out3((this.t - from) / 0.5), 1 - io((this.t - to) / 0.45));
      const v = clamp(p);
      if (v !== this.state.chip.p || this.state.chip.text !== text) this.dirty = true;
      this.state.chip = { n, text, p: v };
    } else if (this.state.chip.p !== 0) { this.state.chip.p = 0; this.dirty = true; }
    const file = path.join(this.dir, String(this.n + 1).padStart(5, "0") + ".jpg");
    if (live || this.dirty || !this.last) {
      await this.page.evaluate((s) => window.__demoSet && window.__demoSet(s), this.state).catch(() => {});
      this.last = await this.page.screenshot({ type: "jpeg", quality: 93 });
      this.shots++;
      this.dirty = false;
    }
    fs.writeFileSync(file, this.last);
    this.n++;
    return true;
  }
  // Hold until scene time `t` (seconds).
  async until(t, live = false) { while (this.t < Math.min(t, this.D) - 1e-6) if (!(await this.tick(live))) break; }
  async hold(sec, live = false) { await this.until(this.t + sec, live); }
  async finish(live = false) { await this.until(this.D, live); fs.writeFileSync(path.join(this.dir, "meta.json"), JSON.stringify({ id: this.id, frames: this.n, D: this.D, shots: this.shots })); console.log(this.id, "frames", this.n, "shots", this.shots, "D", this.D.toFixed(2)); }
  async animate(sec, fn) {
    const n = Math.max(1, Math.round(sec * FPS));
    for (let i = 1; i <= n; i++) { await fn(i / n); this.dirty = true; if (!(await this.tick())) break; }
  }
  async maxScroll() { return this.page.evaluate(() => document.documentElement.scrollHeight - innerHeight); }
  async setScroll(y) { this.scrollY = y; await this.page.evaluate((v) => window.scrollTo(0, v), y); }
  async syncScroll() { this.scrollY = await this.page.evaluate(() => scrollY); }
  async scrollToY(y, sec) {
    await this.syncScroll();
    const from = this.scrollY, to = clamp(y, 0, await this.maxScroll());
    await this.animate(sec, async (p) => this.setScroll(lerp(from, to, io(p))));
  }
  async scrollBy(dy, sec, linear = true) {
    await this.syncScroll();
    const from = this.scrollY, to = clamp(from + dy, 0, await this.maxScroll());
    await this.animate(sec, async (p) => this.setScroll(lerp(from, to, linear ? p : io(p))));
  }
  async driftUntil(t, pxPerSec = 26) { const sec = Math.max(0, Math.min(t, this.D) - this.t); if (sec > 0.05) await this.scrollBy(pxPerSec * sec, sec, true); }
  async box(loc) {
    const l = typeof loc === "string" ? this.page.locator(loc).first() : loc.first();
    await l.waitFor({ state: "attached", timeout: 15000 });
    const b = await l.boundingBox();
    if (!b) throw new Error("no box for " + loc);
    return b;
  }
  async scrollToEl(loc, offset, sec) {
    await this.syncScroll();
    const b = await this.box(loc);
    await this.scrollToY(this.scrollY + b.y - offset, sec);
  }
  async cursorTo(x, y, sec = 0.8) {
    const c = this.state.cursor, fx = c.x, fy = c.y, fo = c.o;
    await this.animate(sec, async (p) => { const e = io(p); c.x = lerp(fx, x, e); c.y = lerp(fy, y, e) - Math.sin(p * Math.PI) * 14; c.o = Math.max(fo, clamp(p * 4)); });
  }
  async cursorToEl(loc, sec = 0.8, fx = 0.5, fy = 0.5) { const b = await this.box(loc); await this.cursorTo(b.x + b.width * fx, b.y + b.height * fy, sec); }
  async cursorHide(sec = 0.3) { const c = this.state.cursor, fo = c.o; await this.animate(sec, async (p) => { c.o = fo * (1 - p); }); }
  async click(loc, { move = 0.8, fx = 0.5, fy = 0.5, act = true } = {}) {
    const l = typeof loc === "string" ? this.page.locator(loc).first() : loc.first();
    await this.cursorToEl(l, move, fx, fy);
    const c = this.state.cursor, r = this.state.ripple;
    r.x = c.x; r.y = c.y;
    await this.animate(0.12, async (p) => { c.s = 1 - 0.14 * p; });
    if (act) await l.click({ timeout: 15000 }).catch((e) => console.log("click failed:", String(e).slice(0, 120)));
    await this.animate(0.4, async (p) => { r.p = p; c.s = 0.86 + 0.14 * clamp(p * 2.5); });
    r.p = 0; this.dirty = true;
  }
  async spotlight(loc, { sec = 0.55, pad = 10 } = {}) {
    const s = this.state.spot;
    const b = await this.box(loc);
    const to = { x: b.x - pad, y: b.y - pad, w: b.width + pad * 2, h: b.height + pad * 2 };
    const from = s.o > 0.01 ? { ...s } : { x: to.x - 24, y: to.y - 24, w: to.w + 48, h: to.h + 48, o: 0 };
    await this.animate(sec, async (p) => { const e = io(p); s.x = lerp(from.x, to.x, e); s.y = lerp(from.y, to.y, e); s.w = lerp(from.w, to.w, e); s.h = lerp(from.h, to.h, e); s.o = lerp(from.o, 1, e); });
  }
  async spotOff(sec = 0.4) { const s = this.state.spot, fo = s.o; if (fo < 0.01) return; await this.animate(sec, async (p) => { s.o = fo * (1 - io(p)); }); s.o = 0; }
  async goto(url) {
    await this.page.goto(url.startsWith("http") ? url : BASE + url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
    await this.page.evaluate(() => document.fonts && document.fonts.ready);
    await this.page.waitForTimeout(500);
    this.scrollY = 0; this.state.spot.o = 0; this.dirty = true;
  }
}

const D = {};
for (const s of scenes) D[s.id] = LEAD + A(s.id) + TAIL;
// Scene 8 is one narration over two pages.
const split8 = wraw("s08-resit", "serv") - 0.3;
D["s08a-declined"] = LEAD + split8 + T / 2;
D["s08b-resit"] = A("s08-resit") - split8 + T / 2 + TAIL;
delete D["s08-resit"];
const ORDER = ["s01-intro", "s02-landing", "s03-sit", "s04-licence", "s05-reppo", "s06-kite", "s07-cases", "s08a-declined", "s08b-resit", "s09-verify", "s10-registry", "s11-outro"];
fs.writeFileSync(path.join(HERE, "timeline.json"), JSON.stringify({ T, LEAD, TAIL, FPS, order: ORDER, D, split8 }, null, 1));

const want = process.argv.slice(2);
const run = (id) => want.length === 0 || want.includes(id);

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--hide-scrollbars", "--force-color-profile=srgb"] });
try {
  // ---------- Title cards ----------
  if (run("s01-intro") || run("s11-outro")) {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, colorScheme: "dark" });
    const page = await ctx.newPage();
    fs.copyFileSync(path.join(HERE, "..", "public", "mark.png"), path.join(HERE, "mark.png"));
    for (const which of ["s01-intro", "s11-outro"]) {
      if (!run(which)) continue;
      await page.goto(pathToFileURL(path.join(HERE, "cards.html")).href, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      const st = new Stage(page);
      st.begin(which, D[which]);
      const k = which === "s01-intro"
        ? { a: 0.35, b: LEAD + wraw(which, "but") - 0.2, c: LEAD + wraw(which, "imprimatur") - 0.35, d: LEAD + wraw(which, "it", 0) - 0.2 }
        : { a: [wraw(which, "serv"), wraw(which, "reppo"), wraw(which, "kite"), wraw(which, "dolphin")].map((x) => LEAD + x - 0.15), b: LEAD + wraw(which, "get") - 0.25, c: LEAD + wraw(which, "spend") + 0.5 };
      while (st.n < st.total) {
        await page.evaluate(([w, t, kk]) => (w === "s01-intro" ? window.renderIntro(t, kk) : window.renderOutro(t, kk)), [which, st.t, k]);
        st.dirty = true;
        await st.tick(true);
      }
      await st.finish();
    }
    await ctx.close();
  }

  // ---------- The live site ----------
  const siteScenes = ORDER.filter((id) => id !== "s01-intro" && id !== "s11-outro" && run(id));
  if (siteScenes.length) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 4 / 3, colorScheme: "dark" });
    await ctx.addInitScript(OVERLAY);
    const page = await ctx.newPage();
    const st = new Stage(page);
    const h = (tag, text) => page.locator(`${tag}:has-text("${text}")`).first();
    const section = (text) => page.locator(`section:has(h2:has-text("${text}"))`).first();
    const onLicence = async (id) => { if (!page.url().includes(id)) await st.goto(`/licence/${id}`); };

    if (run("s02-landing")) {
      const id = "s02-landing", w = (x, n) => LEAD + wraw(id, x, n);
      await st.goto("/");
      // Let anything that animates on first view settle before recording.
      const max = await st.maxScroll();
      for (let y = 0; y <= max; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(90); }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(700);
      st.begin(id, D[id]);
      st.chip("01", "The idea");
      await st.driftUntil(w("most") - 1.5, 22);
      await st.scrollToEl(h("h2", "Would your agent pay these?"), 120, 1.5);
      await st.driftUntil(w("code") - 1.6, 9);
      await st.scrollToEl(h("h3", "Nobody marks their own work"), 330, 1.5);
      await st.until(w("no") - 0.5);
      await st.spotlight(page.locator('h3:has-text("Nobody marks their own work")').locator("xpath=.."), { pad: 9 });
      await st.finish();
      await st.spotOff(0);
    }

    if (run("s03-sit")) {
      const id = "s03-sit", w = (x, n) => LEAD + wraw(id, x, n);
      await st.goto("/sit");
      st.begin(id, D[id]);
      st.chip("02", "The exam room");
      await st.until(w("choose") - 0.9);
      await st.click(page.locator('label:has-text("SERV, bound procedure")'), { move: 0.9, fx: 0.3 });
      await st.until(w("point") - 0.7);
      await st.cursorToEl(page.locator('label:has-text("Your own agent")'), 0.9, 0.3, 0.5);
      await st.until(w("pick") - 1.3);
      await st.scrollToEl(page.locator('legend:has-text("Length")'), 330, 0.7);
      await st.click(page.locator('label:has-text("Short exam")'), { move: 0.6, fx: 0.3 });
      await st.until(w("begin") - 0.9);
      await st.click(page.locator('button:has-text("Begin the examination")'), { move: 0.7 });
      await st.cursorHide(0.3);
      await st.finish(true);
    }

    if (run("s04-licence")) {
      const id = "s04-licence", w = (x, n) => LEAD + wraw(id, x, n);
      await st.goto(`/licence/${LIC_A}`);
      st.state.cursor.o = 0;
      st.begin(id, D[id]);
      st.chip("03", "The licence");
      await st.until(w("grade") - 0.5);
      await st.spotlight(page.locator(".seal").first(), { pad: 14 });
      await st.until(w("forty") - 0.45);
      await st.spotlight(page.locator('dl:has(dt:has-text("Per payment"))').first(), { pad: 16 });
      await st.until(w("that") - 0.5);
      await st.spotOff(0.4);
      await st.scrollToEl(h("h2", "How the limit was reached"), 150, 1.3);
      await st.driftUntil(D[id], 7);
      await st.finish();
    }

    if (run("s05-reppo")) {
      const id = "s05-reppo", w = (x, n) => LEAD + wraw(id, x, n);
      await onLicence(LIC_A);
      st.begin(id, D[id]);
      st.chip("04", "The outside examiner", 0.9, 4.8);
      await st.scrollToEl(h("h2", "Outside examiner (Reppo)"), 96, 1.2);
      await st.until(w("reppo") - 0.4);
      await st.spotlight(section("Outside examiner (Reppo)"), { pad: 8 });
      await st.finish();
    }

    if (run("s06-kite")) {
      const id = "s06-kite", w = (x, n) => LEAD + wraw(id, x, n);
      await onLicence(LIC_A);
      st.begin(id, D[id]);
      st.chip("05", "Enforced by Kite", 0.9, 4.8);
      await st.spotOff(0.3);
      await st.scrollToEl(h("h2", "Enforce it with Kite Passport"), 96, 1.2);
      const sec = section("Enforce it with Kite Passport");
      await st.until(w("so") - 0.4);
      await st.spotlight(sec.locator("pre"), { pad: 8 });
      await st.until(w("we") - 0.4);
      await st.spotlight(sec.locator("li").nth(0), { pad: 8 });
      await st.until(w("when") - 0.4);
      await st.spotlight(sec.locator("li").nth(1), { pad: 8 });
      await st.finish();
    }

    if (run("s07-cases")) {
      const id = "s07-cases", w = (x, n) => LEAD + wraw(id, x, n);
      await onLicence(LIC_A);
      st.begin(id, D[id]);
      st.chip("06", "The record", 0.9, 4.6);
      await st.spotOff(0.3);
      await st.scrollToEl(h("h2", "Every case in this sitting"), 96, 1.2);
      const first = section("Every case in this sitting").locator("summary").first();
      await st.click(first, { move: 0.6, fx: 0.25 });
      await st.cursorHide(0.3);
      await st.driftUntil(w("and", 0) - 1.4, 60);
      await st.scrollToEl(h("h2", "Signature"), 96, 1.2);
      await st.spotlight(section("Signature"), { pad: 8 });
      await st.finish();
    }

    if (run("s08a-declined")) {
      const id = "s08a-declined", w = (x, n) => LEAD + wraw("s08-resit", x, n);
      await st.goto(`/licence/${LIC_DECLINED}`);
      st.state.cursor.o = 0;
      st.begin(id, D[id]);
      st.chip("07", "Feedback that proves itself");
      await st.until(w("this") - 0.4);
      await st.spotlight(page.locator(".seal").first(), { pad: 14 });
      await st.until(w("it") - 0.4);
      await st.spotlight(page.locator("h1").locator("xpath=ancestor::section[1]").locator("p.mt-6").first(), { pad: 14 });
      await st.finish();
    }

    if (run("s08b-resit")) {
      const id = "s08b-resit", w = (x, n) => wraw("s08-resit", x, n) - split8 + T / 2;
      await st.goto(`/licence/${LIC_RESIT}`);
      st.state.cursor.o = 0;
      st.begin(id, D[id]);
      const rules = section("Rules this applicant carried in");
      await st.scrollToEl(page.locator('table:has-text("First sitting")').first(), 150, 0.01);
      await st.until(w("serv") + 0.5);
      await st.spotlight(rules, { pad: 8 });
      await st.until(w("on") - 0.4);
      await st.spotlight(page.locator('table:has-text("First sitting")').first(), { pad: 14 });
      await st.finish();
    }

    if (run("s09-verify")) {
      const id = "s09-verify", w = (x, n) => LEAD + wraw(id, x, n);
      await st.goto("/verify");
      st.state.cursor.o = 0;
      st.begin(id, D[id]);
      st.chip("08", "Verify a licence");
      await st.until(w("paste") - 1.0);
      await st.click(page.locator("#licence-id"), { move: 0.7, fx: 0.2 });
      for (const ch of LIC_A) { await page.keyboard.type(ch); st.dirty = true; await st.tick(); if (!"-".includes(ch)) await st.tick(); }
      await st.click(page.locator('button:has-text("Check it")'), { move: 0.5 });
      await page.waitForLoadState("networkidle").catch(() => {});
      await st.cursorHide(0.3);
      await st.until(w("merchants") - 1.3, true);
      await st.scrollToEl(h("h2", "For software: the paid check"), 120, 1.0);
      await st.spotlight(h("h2", "For software: the paid check").locator("xpath=.."), { pad: 14 });
      await st.finish();
    }

    if (run("s10-registry")) {
      const id = "s10-registry";
      await st.goto("/registry");
      st.state.cursor.o = 0;
      st.begin(id, D[id]);
      st.chip("09", "The public registry", 0.45, 5);
      await st.hold(0.9);
      await st.driftUntil(D[id], 85);
      await st.finish();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
