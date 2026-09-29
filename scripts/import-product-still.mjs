#!/usr/bin/env node
/**
 * Normalises a supplier/client photograph into the still convention the cards
 * and product pages expect, and writes it into `public/`.
 *
 *   node scripts/import-product-still.mjs <source> <public/images/.../slug.jpg> [--bg auto|#rrggbb|white]
 *
 * Same 4:5 frame as `scripts/build-catalogue-images.mjs` (900x1125, `contain`,
 * JPEG progressive mozjpeg q80) so a still shot on a studio ground sits in the
 * grid without the object-fit crop showing a seam.
 *
 * `--bg auto` (the default) samples the source's top-left pixel and pads with
 * that colour, but only when it reads as a light studio ground — otherwise the
 * padding falls back to white. Pass an explicit hex when the ground is graded.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const W = 900;
const H = 1125;

const argv = process.argv.slice(2);
const positional = [];
let bgArg = "auto";
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--bg") bgArg = argv[++i] ?? "auto";
  else if (a.startsWith("--bg=")) bgArg = a.slice(5);
  else positional.push(a);
}

if (positional.length !== 2) {
  console.error(
    "usage: node scripts/import-product-still.mjs <source> <public/images/products/.../slug.jpg> [--bg auto|#rrggbb|white]"
  );
  process.exit(1);
}

const [src, dest] = positional;
if (!fs.existsSync(src)) {
  console.error(`MISSING SOURCE  ${src}`);
  process.exit(1);
}

/** Average colour of the source's border ring, used to pad the 4:5 frame. */
async function studioGround(file) {
  const { data, info } = await sharp(file)
    .resize(40, 40, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x > 1 && y > 1 && x < w - 2 && y < h - 2) continue;
      const i = (y * w + x) * c;
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

let background;
if (bgArg === "white") {
  background = "#ffffff";
} else if (bgArg === "auto") {
  const [r, g, b] = await studioGround(src);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  background = lum > 200 ? `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}` : "#ffffff";
} else {
  background = bgArg;
}

fs.mkdirSync(path.dirname(dest), { recursive: true });

const meta = await sharp(src).metadata();
await sharp(src)
  .flatten({ background })
  .resize(W, H, { fit: "contain", kernel: "lanczos3", background, withoutEnlargement: false })
  .sharpen({ sigma: 0.8 })
  .jpeg({ quality: 80, progressive: true, mozjpeg: true })
  .toFile(dest);

const out = await sharp(dest).metadata();
console.log(
  `${dest}\n  ${meta.format} ${meta.width}x${meta.height} -> ${out.width}x${out.height} jpeg, ` +
    `${(fs.statSync(dest).size / 1024).toFixed(0)} KB, background ${background}`
);
