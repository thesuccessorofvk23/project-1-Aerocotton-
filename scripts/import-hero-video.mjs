#!/usr/bin/env node
/**
 * Encodes the client's hero-film master into the web file the home page ships.
 *
 *   node scripts/import-hero-video.mjs "<master.mp4>"
 *   node scripts/import-hero-video.mjs "<master.mp4>" --out public/hero/other.mp4
 *
 * The supplied masters come straight out of an editor — 1080p at ~22 Mbps,
 * typically ten to twenty times the bitrate the page can justify — so the file
 * cannot be committed as delivered. GitHub warns above 50 MiB per file and
 * *rejects* anything over 100 MiB, so a raw master cannot be pushed at all.
 * This script re-encodes to CRF 22 (measured SSIM ~0.985 against the master,
 * i.e. sub-1% mean pixel difference) at `-preset slow`, which lands the film
 * around 4 Mbps — smaller than the 720p file it replaced while carrying 2.25x
 * the pixels.
 *
 * Two details that are easy to get wrong:
 *
 *  - **Frame rate.** Editor exports often carry a handful of zero-duration
 *    duplicate frames in their `stts` table (this master had 124 of them across
 *    two clusters). Forcing CFR with `-fps_mode cfr` drops exactly those, which
 *    is what we want — they are 65 us apart and no display can show them — and
 *    it rewrites the timeline to a clean 30 fps. Do *not* use
 *    `-fps_mode passthrough` for these masters: it preserves the duplicate
 *    timestamps and the muxer then rewrites DTS to keep them monotonic.
 *  - **faststart.** `-movflags +faststart` moves the `moov` box ahead of `mdat`
 *    so the browser can start decoding before the whole file has arrived.
 *
 * ffmpeg is not a project dependency. Resolution order: `$FFMPEG`, then `ffmpeg`
 * on `PATH`, then a scratch install at
 * `.pdf-work/tools/node_modules/ffmpeg-static/ffmpeg.exe`:
 *
 *   mkdir -p .pdf-work/tools && cd .pdf-work/tools
 *   npm init -y && npm install ffmpeg-static@5
 *
 * The file currently shipped (4.6 MiB) is a *second-generation* re-encode of the
 * previous shipped encode, made to cut the home-page payload from 14.2 MiB — no
 * higher-quality master of this film survives. It was produced with
 * `-preset veryslow -tune film -crf 33`, which measured VMAF 78 against the file
 * it replaced (the `-crf 22` default above scores 82 at 5.2 MiB). Re-import from
 * a master with the defaults when a new film arrives.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const VALUE_FLAGS = ["out", "crf", "preset", "tune"];
const positional = [];
const values = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  const eq = a.indexOf("=");
  const name = a.startsWith("--") ? a.slice(2, eq === -1 ? undefined : eq) : null;
  if (name && VALUE_FLAGS.includes(name)) {
    values[name] = eq === -1 ? args[++i] : a.slice(eq + 1);
    continue;
  }
  if (a.startsWith("--")) continue;
  positional.push(a);
}
const src = positional[0];
const OUT = values.out ?? "public/hero/hero-cotton-intro.mp4";

if (!src) {
  console.error('usage: node scripts/import-hero-video.mjs "<master.mp4>" [--out public/hero/<file>.mp4] [--crf 22] [--preset slow] [--tune film]');
  process.exit(1);
}
if (!fs.existsSync(src)) {
  console.error(`MISSING SOURCE  ${src}`);
  process.exit(1);
}
if (!OUT) {
  console.error("--out needs a path");
  process.exit(1);
}

const CANDIDATES = [
  process.env.FFMPEG,
  "ffmpeg",
  path.join(".pdf-work", "tools", "node_modules", "ffmpeg-static", "ffmpeg.exe"),
].filter(Boolean);

const ffmpeg = CANDIDATES.find((bin) => {
  if (bin.includes(path.sep)) return fs.existsSync(bin);
  return spawnSync(bin, ["-version"], { stdio: "ignore" }).status === 0;
});

if (!ffmpeg) {
  console.error("MISSING ffmpeg — set FFMPEG=/path/to/ffmpeg, or see the header of this file");
  process.exit(1);
}

/** Encode settings. CRF 22 measured at SSIM 0.985 against the delivered master. */
const ENCODE = [
  "-c:v", "libx264",
  "-preset", values.preset ?? "slow",
  "-crf", values.crf ?? "22",
  ...(values.tune ? ["-tune", values.tune] : []),
  "-maxrate", "4500k",
  "-bufsize", "9000k",
  "-profile:v", "high",
  "-level", "4.1",
  "-pix_fmt", "yuv420p",
  "-fps_mode", "cfr",
  "-c:a", "aac",
  "-b:a", "96k",
  "-map_metadata", "-1",
  "-movflags", "+faststart",
];

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1) + " MiB";

/** `ffmpeg -i` writes the stream table to stderr and exits non-zero; that is fine. */
function inspect(file) {
  const r = spawnSync(ffmpeg, ["-hide_banner", "-i", file], { encoding: "utf8" });
  const text = (r.stderr || "") + (r.stdout || "");
  const duration = /Duration:\s*(\d+):(\d+):(\d+\.\d+)/.exec(text);
  const video = /Video:\s*([\w-]+)\s*\(?[^)]*\)?[^,]*,\s*[\w()]+,\s*(\d+)x(\d+)[^,]*,\s*([\d.]+)\s*kb\/s/.exec(text);
  const audio = /Audio:\s*([\w-]+)[^,]*,\s*(\d+)\s*Hz/.exec(text);
  const kb = /bitrate:\s*(\d+)\s*kb\/s/.exec(text);
  return {
    seconds: duration
      ? Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3])
      : null,
    codec: video?.[1] ?? null,
    width: video ? Number(video[2]) : null,
    height: video ? Number(video[3]) : null,
    videoKbps: video ? Number(video[4]) : null,
    audio: audio ? `${audio[1]} ${audio[2]} Hz` : "none",
    kbps: kb ? Number(kb[1]) : null,
  };
}

const before = inspect(src);
console.log(`source  ${src}`);
console.log(
  `        ${before.width}x${before.height} ${before.codec} · ${before.seconds?.toFixed(2)}s · ` +
    `${before.kbps ?? before.videoKbps} kb/s · audio ${before.audio}`
);
console.log(`        ${mb(fs.statSync(src).size)}`);

fs.mkdirSync(path.dirname(OUT), { recursive: true });

console.log(`encode  ${OUT}`);
const started = Date.now();
const run = spawnSync(
  ffmpeg,
  ["-hide_banner", "-loglevel", "warning", "-stats", "-i", src,
   "-map", "0:v:0", "-map", "0:a:0?", ...ENCODE, "-y", OUT],
  { stdio: ["ignore", "inherit", "inherit"] }
);

if (run.status !== 0 || !fs.existsSync(OUT)) {
  console.error(`ENCODE FAILED  ffmpeg exited ${run.status}`);
  process.exit(1);
}

const bytes = fs.statSync(OUT).size;
const after = inspect(OUT);
console.log(
  `done    ${after.width}x${after.height} · ${after.seconds?.toFixed(2)}s · ` +
    `${after.kbps} kb/s · audio ${after.audio}`
);
console.log(
  `        ${mb(bytes)}  (${(bytes / fs.statSync(src).size * 100).toFixed(0)}% of source, ` +
    `${((Date.now() - started) / 1000).toFixed(0)}s)`
);

if (before.seconds && after.seconds && Math.abs(before.seconds - after.seconds) > 0.5) {
  console.log(`WARN    duration moved by ${(after.seconds - before.seconds).toFixed(2)}s`);
}
if (bytes > 100 * 1024 * 1024) {
  console.error("FAIL    over GitHub's 100 MiB hard limit — raise the CRF and re-run");
  process.exit(1);
}
if (bytes > 50 * 1024 * 1024) {
  console.log("WARN    over GitHub's 50 MiB warning threshold — consider a higher CRF");
}
