#!/usr/bin/env node
/**
 * Reads the client's catalogue decks straight out of the .pptx (slide XML +
 * media folder) so every product image can be paired with the slide text that
 * labels it — design number, size, colourway, series.
 *
 *   node scripts/pptx-catalog.mjs <extracted-pptx-dir ...>
 *
 * Writes <dir>/catalog.json and prints a human-readable summary.
 */
import fs from "node:fs";
import path from "node:path";

function slideNumbers(dir) {
  const slidesDir = path.join(dir, "ppt", "slides");
  if (!fs.existsSync(slidesDir)) return [];
  return fs
    .readdirSync(slidesDir)
    .filter((f) => /^slide\d+\.xml$/.test(f))
    .map((f) => Number(/slide(\d+)\.xml/.exec(f)[1]))
    .sort((a, b) => a - b);
}

function textRuns(xml) {
  // <a:t>…</a:t> runs in document order; paragraph breaks become new entries.
  const out = [];
  const re = /<a:t>([\s\S]*?)<\/a:t>|<a:br\s*\/>|<\/a:p>/g;
  let m;
  let buf = "";
  while ((m = re.exec(xml))) {
    if (m[0] === "</a:p>") {
      if (buf.trim()) out.push(buf.trim());
      buf = "";
    } else if (m[0] === "<a:br/>" || m[0] === "<a:br />") {
      if (buf.trim()) out.push(buf.trim());
      buf = "";
    } else {
      buf += m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
      if (buf.length > 200) {
        out.push(buf.trim());
        buf = "";
      }
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function slideImages(dir, n) {
  const relsPath = path.join(dir, "ppt", "slides", "_rels", `slide${n}.xml.rels`);
  const xmlPath = path.join(dir, "ppt", "slides", `slide${n}.xml`);
  if (!fs.existsSync(relsPath) || !fs.existsSync(xmlPath)) return [];
  const rels = {};
  for (const m of fs.readFileSync(relsPath, "utf8").matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) {
    rels[m[1]] = m[2];
  }
  const xml = fs.readFileSync(xmlPath, "utf8");
  const out = [];
  // <p:pic> carries the embed + optional alt text; keep document order.
  for (const pic of xml.matchAll(/<p:pic>[\s\S]*?<\/p:pic>/g)) {
    const body = pic[0];
    const embed = /r:embed="(rId\d+)"/.exec(body);
    if (!embed) continue;
    const target = rels[embed[1]];
    if (!target) continue;
    const name = /name="([^"]*)"/.exec(body);
    const descr = /descr="([^"]*)"/.exec(body);
    out.push({
      rId: embed[1],
      media: target.split("/").pop(),
      name: name ? name[1] : null,
      alt: descr ? descr[1] : null,
    });
  }
  // Cropped pictures (<a:blipFill>) reference media too; record any we missed.
  for (const m of xml.matchAll(/r:embed="(rId\d+)"/g)) {
    const target = rels[m[1]];
    if (!target) continue;
    const media = target.split("/").pop();
    if (!out.some((o) => o.media === media)) out.push({ rId: m[1], media, name: null, alt: null });
  }
  return out;
}

/**
 * Positioned items on a slide: pictures and text boxes with their offsets, so
 * SKU captions can be matched to the picture they label.
 */
function slideLayout(dir, n) {
  const xmlPath = path.join(dir, "ppt", "slides", `slide${n}.xml`);
  const relsPath = path.join(dir, "ppt", "slides", "_rels", `slide${n}.xml.rels`);
  if (!fs.existsSync(xmlPath)) return { images: [], texts: [] };
  const rels = {};
  if (fs.existsSync(relsPath)) {
    for (const m of fs.readFileSync(relsPath, "utf8").matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) {
      rels[m[1]] = m[2].split("/").pop();
    }
  }
  const xml = fs.readFileSync(xmlPath, "utf8");
  const off = (body) => {
    const o = /<a:off x="(-?\d+)" y="(-?\d+)"/.exec(body);
    const e = /<a:ext cx="(\d+)" cy="(\d+)"/.exec(body);
    return o
      ? { x: Number(o[1]), y: Number(o[2]), cx: e ? Number(e[1]) : 0, cy: e ? Number(e[2]) : 0 }
      : null;
  };
  const images = [];
  for (const m of xml.matchAll(/<p:pic>([\s\S]*?)<\/p:pic>/g)) {
    const embed = /r:embed="(rId\d+)"/.exec(m[1]);
    const box = off(m[1]);
    if (!embed || !box) continue;
    images.push({ media: rels[embed[1]] ?? null, ...box });
  }
  const texts = [];
  for (const m of xml.matchAll(/<p:sp>([\s\S]*?)<\/p:sp>/g)) {
    const box = off(m[1]);
    if (!box) continue;
    const runs = [...m[1].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((x) => x[1].trim()).filter(Boolean);
    if (!runs.length) continue;
    texts.push({ text: runs.join(" "), ...box });
  }
  return { images, texts };
}

/** Picture ↔ caption pairing: same column band, nearest vertically. */
function pairLabels(layout) {
  return layout.images.map((img) => {
    const cx = img.x + img.cx / 2;
    const candidates = layout.texts
      .map((t) => ({
        ...t,
        dx: Math.abs(t.x + t.cx / 2 - cx),
        dy: t.y + t.cy / 2 - (img.y + img.cy / 2),
      }))
      .filter((t) => t.dx < Math.max(img.cx, t.cx) * 0.75)
      .sort((a, b) => Math.abs(a.dy) - Math.abs(b.dy));
    return { media: img.media, label: candidates[0]?.text ?? null };
  });
}

const dirs = process.argv.slice(2);
const catalog = [];
for (const dir of dirs) {
  const deck = path.basename(dir);
  const slides = [];
  for (const n of slideNumbers(dir)) {
    const xml = fs.readFileSync(path.join(dir, "ppt", "slides", `slide${n}.xml`), "utf8");
    const layout = slideLayout(dir, n);
    slides.push({
      slide: n,
      text: textRuns(xml),
      images: slideImages(dir, n),
      labels: pairLabels(layout),
    });
  }
  catalog.push({ deck, slides });
  fs.writeFileSync(path.join(dir, "catalog.json"), JSON.stringify({ deck, slides }, null, 2));

  console.log(`\n############ ${deck} — ${slides.length} slides`);
  for (const s of slides) {
    console.log(`\n--- slide ${s.slide}`);
    if (s.text.length) console.log(`    text: ${s.text.join(" | ")}`);
    for (const im of s.images) {
      const label = s.labels.find((l) => l.media === im.media)?.label;
      console.log(
        `    img : ${im.media}${label ? `  LABEL="${label}"` : ""}${im.alt ? `  alt="${im.alt}"` : ""}${
          im.name ? `  name="${im.name}"` : ""
        }`
      );
    }
  }
}
