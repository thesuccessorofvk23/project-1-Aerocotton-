#!/usr/bin/env node
/**
 * Writes the shipped product images for everything catalogued in
 * `src/content/catalogue.ts`, from the extracted deck media in `.pdf-work/norm`.
 *
 *   node scripts/build-catalogue-images.mjs            # write them
 *   node scripts/build-catalogue-images.mjs --check    # report coverage only
 *
 * Every image is normalised to the 4:5 frame the cards and detail pages use,
 * so nothing important is lost to object-fit cropping. The extension on the
 * catalogued `image` path picks the encoder: `.webp` for the shipped product
 * stills (WebP q82), anything else for progressive mozjpeg q80 JPEG.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { catalogueProducts } from "../src/content/catalogue.ts";

const NORM = ".pdf-work/norm";
const check = process.argv.includes("--check");
const W = 900;
const H = 1125;

let written = 0;
let skipped = 0;
let missing = 0;

for (const product of catalogueProducts) {
  const rel = product.image.replace(/^\//, ""); // images/products/<deck>/<slug>.jpg
  const outFile = path.join("public", rel);
  const deckDir = path.basename(path.dirname(rel));
  const src = path.join(NORM, deckDir, product.source.replace(/^\//, ""));
  if (!fs.existsSync(src)) {
    console.error(`MISSING SOURCE  ${src}   (${product.slug})`);
    missing++;
    continue;
  }
  if (check) {
    skipped++;
    continue;
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const framed = sharp(src)
    .flatten({ background: "#ffffff" })
    .resize(W, H, { fit: "contain", background: "#ffffff", withoutEnlargement: false });
  await (path.extname(outFile).toLowerCase() === ".webp"
    ? framed.webp({ quality: 82, effort: 6 })
    : framed.jpeg({ quality: 80, progressive: true, mozjpeg: true })
  ).toFile(outFile);
  written++;
}

console.log(
  check
    ? `${skipped} products catalogued, ${missing} missing source files`
    : `${written} images written, ${missing} missing source files`
);
if (missing) process.exitCode = 1;
