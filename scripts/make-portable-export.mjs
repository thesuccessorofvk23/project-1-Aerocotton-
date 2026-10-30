#!/usr/bin/env node
/**
 * Builds `out-portable/` — a copy of the static export in `out/` where every
 * root-absolute URL is rewritten to a relative one, so the site can be opened
 * by double-clicking `out-portable/index.html` (file://, no web server).
 *
 *   node scripts/make-portable-export.mjs [--from out] [--to out-portable]
 *
 * Why a copy: on a web server the export's absolute paths are correct and give
 * pretty URLs (/about/) plus client-side routing, so `out/` is left exactly as
 * `next build` wrote it. Under file:// an absolute path resolves against the
 * filesystem root (file:///_next/..., file:///images/...), which is why the
 * page opens with no CSS, no JS and no media.
 *
 * What it rewrites, per HTML file (depth-aware, so nested pages get ../):
 *   - href/src/poster/action/content attributes starting with /, and no other
 *     text, so the markup keeps the shape a host serves
 *   - any path that resolves to a directory becomes <dir>/index.html, because
 *     browsers list a directory instead of serving its index under file://
 *
 * Rewriting the inline RSC payload too (`--rewrite-payload`) is supported but
 * OFF by default: the client runtime reads chunk paths out of that payload, and
 * with them relativised React stops hydrating even when the copy is served over
 * HTTP. Leaving the payload absolute costs nothing under file:// (nothing
 * hydrates there anyway, so the rewritten attributes stand) and keeps the copy
 * fully interactive wherever it *is* served.
 * It also injects a file://-only click handler: Next's client router cannot
 * fetch its payloads from file://, so navigation falls back to a plain load of
 * the rewritten href.
 *
 * The homepage's opening curtain (CinematicLoadingScreen) is armed by a
 * before-paint script that only fires when `location.pathname` is `/`, so it
 * stays shut for a file path. The copy therefore gets a small head script on
 * index.html that arms and retires the same class hand-offs, so the doors
 * still open locally — and are always retired, even where no animation clock
 * ticks, because that same script owns both timers.
 *
 * Not rewritten: 404.html (it is served at arbitrary depths on a host, so its
 * assets must stay absolute) and the .txt RSC payloads (unused under file://).
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const from = path.resolve(flag("from", "out"));
const to = path.resolve(flag("to", "out-portable"));
const rewritePayload = args.includes("--rewrite-payload");

if (!fs.existsSync(path.join(from, "index.html"))) {
  console.error(`no export at ${from} — run \`npm run build\` first`);
  process.exit(1);
}

fs.rmSync(to, { recursive: true, force: true });
fs.cpSync(from, to, { recursive: true });

/** Rewrite one root-absolute path for a document at `prefix` depth. */
const makeMapper = (prefix) => (value) => {
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  const hashAt = value.search(/[?#]/);
  const pathname = hashAt === -1 ? value : value.slice(0, hashAt);
  const suffix = hashAt === -1 ? "" : value.slice(hashAt);
  const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = path.join(to, rel);
  if (fs.existsSync(target)) {
    const kind = fs.statSync(target);
    if (kind.isFile()) return prefix + rel + suffix;
    if (kind.isDirectory()) return prefix + rel.replace(/\/?$/, "/") + "index.html" + suffix;
  }
  const asDir = path.join(to, rel, "index.html");
  if (fs.existsSync(asDir)) return prefix + rel.replace(/\/?$/, "/") + "index.html" + suffix;
  return null;
};

const ATTR = /(\b(?:href|src|poster|action|content)=)(")([^"]*)(")/g;
const QUOTED = /(\\?)"(\/(?!\/)[^"\\\n]{1,})"/g;

/** Mirrors the armer in src/app/layout.tsx, but for a file:// homepage. */
const LOCAL_INTRO = `<script>(function(){if(location.protocol!=="file:")return;var root=document.documentElement;if(root.classList.contains("intro-armed"))return;root.classList.add("intro-armed","intro-locked");try{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)root.classList.add("intro-static");}catch(e){}window.setTimeout(function(){root.classList.remove("intro-locked");},2200);window.setTimeout(function(){root.classList.remove("intro-armed","intro-locked");root.classList.add("intro-done");},3100);})();</script>`;

const FILE_CLICK_BYPASS = `<script>(function(){if(location.protocol!=="file:")return;document.addEventListener("click",function(e){var t=e.target;while(t&&t.nodeType!==1)t=t.parentNode;var a=t&&t.closest?t.closest("a[href]"):null;if(!a)return;var h=a.getAttribute("href");if(!h||h.charAt(0)==="#"||/^[a-z][a-z0-9+.-]*:/i.test(h)||a.target==="_blank"||a.hasAttribute("download"))return;e.preventDefault();e.stopPropagation();location.href=a.href;},true);})();</script>`;

const htmlFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".html")) htmlFiles.push(p);
  }
};
walk(to);

let rewritten = 0;
let skipped404 = 0;
for (const file of htmlFiles) {
  if (path.relative(to, file) === "404.html") {
    skipped404 += 1;
    continue;
  }
  const depth = path.relative(to, path.dirname(file)).split(path.sep).filter(Boolean).length;
  const prefix = depth === 0 ? "./" : "../".repeat(depth);
  const map = makeMapper(prefix);

  let text = fs.readFileSync(file, "utf8");
  text = text.replace(ATTR, (m, lead, open, value, close) => {
    const mapped = map(value);
    return mapped ? `${lead}${open}${mapped}${close}` : m;
  });
  if (rewritePayload) {
    text = text.replace(QUOTED, (m, slash, value) => {
      const mapped = map(value);
      return mapped ? `${slash}"${mapped}"` : m;
    });
  }
  if (text.includes("</body>")) {
    text = text.replace("</body>", `${FILE_CLICK_BYPASS}</body>`);
  }
  if (path.relative(to, file) === "index.html" && text.includes("</head>")) {
    text = text.replace("</head>", `${LOCAL_INTRO}</head>`);
  }
  fs.writeFileSync(file, text);
  rewritten += 1;
}

const leftovers = htmlFiles
  .filter((f) => path.relative(to, f) !== "404.html")
  .map((f) => {
    const text = fs.readFileSync(f, "utf8");
    return [...text.matchAll(ATTR)].filter(([, , , v]) => v.startsWith("/") && !v.startsWith("//")).length;
  })
  .reduce((a, b) => a + b, 0);

const README = `Aerocotton — view-only copy of the built site
=============================================

Open: index.html   (double-click, or drag it into a browser tab)

Why this copy exists
  next build writes absolute paths (/_next/..., /images/...), which a browser
  resolves against the filesystem root when a page is opened as a local file,
  so out/index.html shows up with no CSS, no JS and no images. Here those paths
  are relative, so the design, fonts, pictures, video and the opening sequence
  all work straight off the disk.

What does NOT work here
  Anything that needs JavaScript to take over: the mobile menu, form checks,
  scroll-reveal motion, the 3D viewers. Browsers refuse to fetch from file://,
  so React never hydrates. For the fully interactive site use the built export
  behind a web server instead:
      npm start          then open http://localhost:4181

Do not deploy this folder
  Upload the contents of out/ (not out-portable/) to the web root; that copy
  keeps clean URLs such as /about/ and client-side routing. Delete this file
  before serving the folder if you ever do serve it.
`;
fs.writeFileSync(path.join(to, "README.txt"), README);

console.log(`portable export -> ${to}`);
console.log(`  rewritten html files : ${rewritten}`);
console.log(`  left as-is           : 404.html (${skipped404 ? "absolute paths needed on a host" : "not present"})`);
console.log(`  absolute refs left   : ${leftovers} (non-existent targets are never rewritten)`);
console.log(`  open                 : ${path.join(to, "index.html")}`);
