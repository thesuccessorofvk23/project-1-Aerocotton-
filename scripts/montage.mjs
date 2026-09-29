#!/usr/bin/env node
/**
 * Builds labelled contact sheets (JPEG) from a folder of extracted images so
 * the catalogue can be reviewed quickly.
 *
 *   node scripts/montage.mjs <dir> [--cols 6] [--rows 4] [--cell 240x300] [--out dir] [--prefix name]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--"));
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const cols = Number(flag("cols", 6));
const rows = Number(flag("rows", 4));
const [cellW, cellH] = flag("cell", "240x300").split("x").map(Number);
const outDir = flag("out", path.join(dir, "..", "sheets"));
const prefix = flag("prefix", path.basename(path.resolve(dir)));
const labelH = 18;
const pad = 8;

const files = fs
  .readdirSync(dir)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .sort();
fs.mkdirSync(outDir, { recursive: true });

const perSheet = cols * rows;
const sheetW = cols * (cellW + pad) + pad;
const sheetH = rows * (cellH + pad) + pad;

const written = [];
for (let s = 0; s * perSheet < files.length; s++) {
  const slice = files.slice(s * perSheet, (s + 1) * perSheet);
  const composites = [];
  for (let i = 0; i < slice.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (cellW + pad);
    const y = pad + row * (cellH + pad);
    const thumb = await sharp(path.join(dir, slice[i]))
      .flatten({ background: "#ffffff" })
      .resize(cellW, cellH - labelH, { fit: "contain", background: "#ffffff" })
      .toBuffer();
    composites.push({ input: { create: { width: cellW, height: cellH - labelH, channels: 3, background: "#ffffff" } }, left: x, top: y });
    composites.push({ input: thumb, left: x, top: y });
    const idx = s * perSheet + i + 1;
    const label = `${idx}  ${slice[i].replace(/\.(jpg|png|jpeg)$/i, "")}`;
    const svg = Buffer.from(
      `<svg width="${cellW}" height="${labelH}" xmlns="http://www.w3.org/2000/svg">
         <rect width="${cellW}" height="${labelH}" fill="#171614"/>
         <text x="4" y="13" font-family="DejaVu Sans, sans-serif" font-size="11" fill="#f4f0e8">${label}</text>
       </svg>`
    );
    composites.push({ input: svg, left: x, top: y + cellH - labelH });
  }
  const out = path.join(outDir, `${prefix}-${String(s + 1).padStart(2, "0")}.jpg`);
  await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: "#e6dfd2" } })
    .composite(composites)
    .jpeg({ quality: 78 })
    .toFile(out);
  written.push(out);
}
console.log(written.join("\n"));
