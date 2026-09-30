#!/usr/bin/env node
/**
 * Normalises a supplied photograph into the editorial convention used by
 * `public/images/editorial/` and writes it into `public/`.
 *
 *   node scripts/import-editorial-image.mjs <source> <public/images/editorial/slug.jpg> [--max 2000]
 *
 * The editorial frames are wide and `object-fit: cover` crops whatever is left
 * over, so this keeps the source's own pixels rather than re-framing it: EXIF
 * orientation is baked in, colour is forced to sRGB, metadata is dropped and
 * the long edge is capped at `--max` (default 2000, never enlarged). Encoded as
 * progressive mozjpeg q80 — the same setting the rest of the stills use.
 *
 * Pass a small `--max` only when the source is enormous; the browser crop is
 * better left to CSS, since the box aspect differs per viewport.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const argv = process.argv.slice(2);
const positional = [];
let maxEdge = 2000;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--max") maxEdge = Number(argv[++i]);
  else if (a.startsWith("--max=")) maxEdge = Number(a.slice(6));
  else positional.push(a);
}

if (positional.length !== 2 || !Number.isFinite(maxEdge) || maxEdge <= 0) {
  console.error(
    "usage: node scripts/import-editorial-image.mjs <source> <public/images/editorial/slug.jpg> [--max 2000]"
  );
  process.exit(1);
}

const [src, dest] = positional;
if (!fs.existsSync(src)) {
  console.error(`MISSING SOURCE  ${src}`);
  process.exit(1);
}
if (path.extname(dest).toLowerCase() !== ".jpg") {
  console.error(`EXPECTED .jpg DEST  ${dest}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });

const meta = await sharp(src).metadata();
const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);

const pipeline = sharp(src).rotate().toColorspace("srgb");
if (longEdge > maxEdge) {
  pipeline.resize({
    width: meta.width >= meta.height ? maxEdge : undefined,
    height: meta.height > meta.width ? maxEdge : undefined,
    kernel: "lanczos3",
  });
}

await pipeline.jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(dest);

const out = await sharp(dest).metadata();
const resized = longEdge > maxEdge;
console.log(
  `${dest}\n  source ${src}\n  ${meta.format ?? "?"} ${meta.width}x${meta.height} (orientation ${meta.orientation ?? 1})` +
    `${resized ? ` capped to long edge ${maxEdge}` : " kept at native size"} -> ` +
    `${out.width}x${out.height} jpeg, ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`
);
