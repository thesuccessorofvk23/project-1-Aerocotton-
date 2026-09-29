#!/usr/bin/env node
/**
 * Derives the brand lockup assets used by the site header and footer from a
 * single flattened supplier artwork, and writes them into `public/brand/`.
 *
 *   node scripts/import-brand-logo.mjs "<source.png>"
 *
 * The supplied LOGO.png is a flattened RGB export on a light studio plate, so
 * it cannot be dropped onto the cocoa footer or over the hero film as-is. This
 * script keys the plate out to real alpha (alpha from plate deviation, then
 * unpremultiplied so anti-aliased edges keep their colour) and writes:
 *
 *   public/brand/aerocotton-mark.png        monogram only, transparent — header
 *   public/brand/aerocotton-lockup-dark.png full lockup, transparent, with the
 *                                           dark strap-line re-inked light so
 *                                           it survives on the cocoa footer
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const src = process.argv[2];
if (!src) {
  console.error('usage: node scripts/import-brand-logo.mjs "<source.png>"');
  process.exit(1);
}
if (!fs.existsSync(src)) {
  console.error(`MISSING SOURCE  ${src}`);
  process.exit(1);
}

const OUT = "public/brand";
/** Plate-deviation window: below LO is plate, above HI is solid ink. */
const LO = 8;
const HI = 30;
/** Footer re-ink target for the strap-line (matches the footer text colour). */
const REINK = [0xee, 0xf0, 0xe8];

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const BG = [data[0], data[1], data[2]];
const at = (x, y) => (y * W + x) * C;
const deviation = (i) =>
  Math.max(Math.abs(data[i] - BG[0]), Math.abs(data[i + 1] - BG[1]), Math.abs(data[i + 2] - BG[2]));

/** alpha + unpremultiplied colour for one pixel of the flattened artwork. */
function key(i) {
  const a = Math.min(1, Math.max(0, (deviation(i) - LO) / (HI - LO)));
  if (a <= 0) return [0, 0, 0, 0];
  const c = [0, 1, 2].map((k) => Math.min(255, Math.max(0, (data[i + k] - (1 - a) * BG[k]) / a)));
  return [c[0], c[1], c[2], a * 255];
}

/** Row coverage of ink, used to find the monogram / wordmark / strap bands. */
const cover = new Float64Array(H);
for (let y = 0; y < H; y++) {
  let n = 0;
  for (let x = 0; x < W; x++) if (deviation(at(x, y)) > 24) n++;
  cover[y] = n / W;
}
const gapStarts = [];
for (let y = 1; y < H - 1; y++) if (cover[y] <= 0.002 && cover[y - 1] > 0.002) gapStarts.push(y);
if (!gapStarts.length) {
  console.error("Could not find the gap between the monogram and the wordmark.");
  process.exit(1);
}
const monoEnd = Math.min(H - 1, gapStarts[0] + 6);
console.log(`source ${path.basename(src)} ${W}x${H} · plate #${BG.map((v) => v.toString(16).padStart(2, "0")).join("")}`);
console.log(`bands · monogram 0-${gapStarts[0] - 1} · crop 0-${monoEnd}`);

/** Writes a transparent PNG from a per-pixel transform of the keyed artwork. */
async function write(dest, fromY, toY, transform) {
  const w = W;
  const h = toY - fromY + 1;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = key(at(x, fromY + y));
      const [r, g, b, a] = transform ? transform(p) : p;
      const o = (y * w + x) * 4;
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = a;
    }
  }
  fs.mkdirSync(OUT, { recursive: true });
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9, palette: false })
    .toFile(dest);
  const { size } = fs.statSync(dest);
  console.log(`${dest}  ${w}x${h}  ${(size / 1024).toFixed(1)} KB`);
  return { w, h };
}

/** Re-inks the near-black, desaturated strap-line so it reads on dark ground. */
function rein(light) {
  return ([r, g, b, a]) => {
    if (a === 0) return [r, g, b, a];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = (r + g + b) / 3;
    return lum < 110 && max - min < 40 ? [REINK[0], REINK[1], REINK[2], a] : [r, g, b, a];
  };
}

await write(`${OUT}/aerocotton-mark.png`, 0, monoEnd);
await write(`${OUT}/aerocotton-lockup-dark.png`, 0, H - 1, rein());
