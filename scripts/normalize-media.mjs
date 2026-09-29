#!/usr/bin/env node
/**
 * Normalises every catalogue deck into one predictable layout:
 *   .pdf-work/norm/<deck>/NN_MM_<code>.<ext>
 * where NN = slide/page number and MM = position on that slide.
 *
 * Decks with the original .pptx are copied from ppt/media in slide order via
 * catalog.json (media file numbering does not follow slide order). Decks that
 * only exist as PDF use the object order from the PDF extraction, which
 * follows page order.
 */
import fs from "node:fs";
import path from "node:path";

const norm = ".pdf-work/norm";
fs.mkdirSync(norm, { recursive: true });

/** deck slug -> { catalog, pptxDir } */
const pptxDecks = [
  { slug: "autumn-cushion-2026", dir: ".pdf-work/pptx/AUTUMN-CUSHION-2026" },
  { slug: "blankets", dir: ".pdf-work/pptx/Blankets" },
  { slug: "kitchen-towels-cad", dir: ".pdf-work/pptx/Kitchen-Towels-CAD" },
  { slug: "textiles-product", dir: ".pdf-work/pptx/TEXTILES-PRODCUT-PPT" },
];

/** deck slug -> extraction dir from pdf-images.mjs */
const pdfDecks = [
  { slug: "place-mats-runners", dir: ".pdf-work/raw/place-mats-runners-pptx-2" },
  { slug: "cushions-chair-pads", dir: ".pdf-work/raw/cushions-1-chair-pads-pptx" },
];

const index = [];

for (const { slug, dir } of pptxDecks) {
  const catalog = JSON.parse(fs.readFileSync(path.join(dir, "catalog.json"), "utf8"));
  const outDir = path.join(norm, slug);
  fs.mkdirSync(outDir, { recursive: true });
  const seen = new Map();
  for (const slide of catalog.slides) {
    for (const img of slide.images) {
      const src = path.join(dir, "ppt", "media", img.media);
      if (!fs.existsSync(src)) {
        console.warn(`missing media ${src}`);
        continue;
      }
      const n = (seen.get(slide.slide) ?? 0) + 1;
      seen.set(slide.slide, n);
      const ext = path.extname(img.media);
      const name = `${String(slide.slide).padStart(2, "0")}_${String(n).padStart(2, "0")}_${path.basename(
        img.media,
        ext
      )}${ext}`;
      fs.copyFileSync(src, path.join(outDir, name));
      index.push({
        deck: slug,
        slide: slide.slide,
        position: n,
        source: "pptx",
        file: `${slug}/${name}`,
        alt: img.alt ?? null,
        slideText: slide.text,
      });
    }
  }
}

for (const { slug, dir } of pdfDecks) {
  const outDir = path.join(norm, slug);
  fs.mkdirSync(outDir, { recursive: true });
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort();
  // Group consecutive images into slide-sized runs of 3 (place mats / chair pad
  // leaves) — refined later once the sheets have been reviewed.
  files.forEach((f, i) => {
    const name = `p${String(i + 1).padStart(3, "0")}${path.extname(f)}`;
    fs.copyFileSync(path.join(dir, f), path.join(outDir, name));
    index.push({ deck: slug, slide: null, position: i + 1, source: "pdf", file: `${slug}/${name}`, alt: null, slideText: [] });
  });
}

fs.writeFileSync(path.join(norm, "index.json"), JSON.stringify(index, null, 2));
const counts = {};
for (const row of index) counts[row.deck] = (counts[row.deck] ?? 0) + 1;
console.log(JSON.stringify(counts, null, 2));
