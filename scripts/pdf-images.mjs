#!/usr/bin/env node
/**
 * AERO COTTON — catalogue PDF image extractor.
 *
 * The client sends catalogue decks (PowerPoint exported to PDF). This script
 * pulls every embedded raster image out of those PDFs so product photography
 * can be re-used on the site without the source .pptx files.
 *
 * Deliberately dependency-free (Node built-ins only): the repo ships no PDF
 * tooling, and this is a one-off asset pipeline, not runtime code.
 *
 *   node scripts/pdf-images.mjs report  <file.pdf ...>
 *   node scripts/pdf-images.mjs extract <file.pdf ...> --out <dir>
 *
 * Handles DCTDecode (JPEG, dumped byte-for-byte) and FlateDecode (rebuilt as
 * PNG, with PNG predictors undone). Image masks / soft masks / tiny decoration
 * art are reported but skipped by default (--keep-all overrides).
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

/* ------------------------------------------------------------------ */
/* PDF object scanning                                                 */
/* ------------------------------------------------------------------ */

/**
 * Image XObjects are always *stream* objects, and stream objects can never be
 * stored inside an object stream, so a flat scan for "<n> <g> obj" is enough
 * to find every candidate without implementing xref reconstruction.
 */
function readObjects(buf) {
  const s = buf.toString("latin1");
  const objects = new Map();
  const re = /(\d+)[ \t\r\n]+(\d+)[ \t\r\n]+obj\b/g;
  let m;
  while ((m = re.exec(s))) {
    const num = Number(m[1]);
    const bodyStart = m.index + m[0].length;
    const streamKw = s.indexOf("stream", bodyStart);
    const endobjKw = s.indexOf("endobj", bodyStart);
    const isStream = streamKw !== -1 && (endobjKw === -1 || streamKw < endobjKw);
    const dictEnd = isStream
      ? streamKw
      : endobjKw === -1
        ? Math.min(s.length, bodyStart + 4000)
        : endobjKw;
    const dict = s.slice(bodyStart, dictEnd);
    let dataStart = -1;
    let length = undefined;
    let lengthRef = undefined;
    if (isStream) {
      let p = streamKw + "stream".length;
      if (s[p] === "\r") p += 1;
      if (s[p] === "\n") p += 1;
      dataStart = p;
      const declared = /\/Length[ \t\r\n]+(\d+)([ \t\r\n]+\d+[ \t\r\n]+R)?/.exec(dict);
      if (declared) {
        if (declared[2]) lengthRef = Number(declared[1]);
        else length = Number(declared[1]);
      }
    }
    objects.set(num, { num, dict, dataStart, length, lengthRef, isStream });
  }
  // Second pass: indirect /Length values ("… /Length 11 0 R …").
  for (const obj of objects.values()) {
    if (!obj.isStream) continue;
    let len = obj.length;
    if (len === undefined && obj.lengthRef !== undefined) {
      const target = objects.get(obj.lengthRef);
      if (target && target.dict) len = num(target.dict, "Length");
    }
    const fallback = s.indexOf("endstream", obj.dataStart);
    let end = len !== undefined ? obj.dataStart + len : fallback;
    // Guard against a bad reference swallowing the rest of the file.
    if (end > s.length || (fallback !== -1 && end > fallback)) end = fallback;
    if (end === -1) end = s.length;
    while (end > obj.dataStart && (s[end - 1] === "\n" || s[end - 1] === "\r")) end -= 1;
    obj.dataEnd = end;
  }
  return objects;
}

const num = (dict, key) => {
  const m = new RegExp(`/${key}[ \\t\\r\\n]+(-?\\d+)`).exec(dict);
  return m ? Number(m[1]) : undefined;
};

const ref = (dict, key) => {
  const m = new RegExp(`/${key}[ \\t\\r\\n]+(\\d+)[ \\t\\r\\n]+(\\d+)[ \\t\\r\\n]+R`).exec(
    dict
  );
  return m ? Number(m[1]) : undefined;
};

const nameVal = (dict, key) => {
  const m = new RegExp(`/${key}[ \\t\\r\\n]+/([A-Za-z0-9#_.+-]+)`).exec(dict);
  return m ? m[1] : undefined;
};

/* ------------------------------------------------------------------ */
/* Stream decoding                                                     */
/* ------------------------------------------------------------------ */

function filtersOf(dict) {
  const m = /\/Filter[ \t\r\n]*(\[[^\]]*\]|\/[A-Za-z0-9]+)/.exec(dict);
  if (!m) return [];
  return [...m[1].matchAll(/\/([A-Za-z0-9]+)/g)].map((x) => x[1]);
}

function inflate(data) {
  try {
    return zlib.inflateSync(data);
  } catch {
    try {
      return zlib.inflateRawSync(data);
    } catch {
      return null;
    }
  }
}

/** Undo PNG predictors (/Predictor >= 10) in place. */
function undoPredictor(data, colors, bpc, columns) {
  const bpp = Math.max(1, Math.ceil((colors * bpc) / 8));
  const rowBytes = Math.ceil((colors * bpc * columns) / 8);
  const rows = Math.floor(data.length / (rowBytes + 1));
  const out = Buffer.alloc(rows * rowBytes);
  let prev = Buffer.alloc(rowBytes);
  let pos = 0;
  for (let r = 0; r < rows; r++) {
    const ft = data[pos++];
    const raw = data.subarray(pos, pos + rowBytes);
    pos += rowBytes;
    const cur = Buffer.alloc(rowBytes);
    for (let i = 0; i < rowBytes; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = raw[i];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = v & 0xff;
    }
    cur.copy(out, r * rowBytes);
    prev = cur;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* PNG writer (for FlateDecode images)                                 */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function pngEncode(width, height, channels, data) {
  const colorType = channels === 1 ? 0 : channels === 2 ? 4 : channels === 3 ? 2 : 6;
  const raw = Buffer.alloc(height * (width * channels + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * channels + 1)] = 0;
    data.copy(raw, y * (width * channels + 1) + 1, y * width * channels, (y + 1) * width * channels);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Expand 1/2/4-bit samples to 8-bit. */
function expandBits(data, width, height, channels, bpc) {
  const out = Buffer.alloc(width * height * channels);
  const perByte = 8 / bpc;
  const mask = (1 << bpc) - 1;
  const scale = 255 / mask;
  for (let i = 0; i < width * height * channels; i++) {
    const byte = data[Math.floor(i / perByte)];
    const shift = 8 - bpc * ((i % perByte) + 1);
    out[i] = Math.round(((byte >> shift) & mask) * scale);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* JPEG introspection                                                  */
/* ------------------------------------------------------------------ */

function jpegInfo(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    const isSOF =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSOF) {
      return {
        width: buf.readUInt16BE(i + 7),
        height: buf.readUInt16BE(i + 5),
        channels: buf[i + 9],
      };
    }
    if (marker === 0xda) break;
    i += 2 + len;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Extraction                                                          */
/* ------------------------------------------------------------------ */

/** Every object number referenced as an /SMask or /Mask (skip those). */
function maskObjectNumbers(objects) {
  const skip = new Set();
  for (const o of objects.values()) {
    if (!o.dict) continue;
    for (const key of ["SMask", "Mask"]) {
      const m = new RegExp(`/${key}[ \\t\\r\\n]+(\\d+)[ \\t\\r\\n]+\\d+[ \\t\\r\\n]+R`).exec(o.dict);
      if (m) skip.add(Number(m[1]));
    }
  }
  return skip;
}

function extractPdf(file, { outDir, keepAll, minPx, report }) {
  const buf = fs.readFileSync(file);
  const objects = readObjects(buf);
  const skipMasks = maskObjectNumbers(objects);
  const found = [];
  const problems = [];

  for (const [objNum, obj] of objects) {
    if (!obj.isStream || !/\/Subtype[ \t\r\n]*\/Image/.test(obj.dict)) continue;
    const raw = buf.subarray(obj.dataStart, obj.dataEnd);
    const dict = obj.dict;
    const filters = filtersOf(dict);
    const isMask = /\/ImageMask[ \t\r\n]+true/.test(dict);
    const w = num(dict, "Width");
    const h = num(dict, "Height");
    const bpc = num(dict, "BitsPerComponent") ?? 8;
    const cs = nameVal(dict, "ColorSpace") ?? "unknown";
    const record = {
      obj: objNum,
      filters,
      width: w,
      height: h,
      bits: bpc,
      colorSpace: cs,
      bytes: raw.length,
      isMask,
      isSoftMask: skipMasks.has(objNum),
    };

    if (isMask || skipMasks.has(objNum)) {
      record.skipped = isMask ? "image-mask" : "soft-mask";
      found.push(record);
      continue;
    }
    if (filters.includes("JPXDecode")) {
      record.skipped = "jpx (jpeg2000)";
      problems.push(`obj ${objNum}: JPXDecode not supported`);
      found.push(record);
      continue;
    }
    if (!w || !h) {
      record.skipped = "no dimensions";
      found.push(record);
      continue;
    }
    const tooSmall = Math.min(w, h) < minPx;
    if (tooSmall && !keepAll) {
      record.skipped = `smaller than ${minPx}px`;
      found.push(record);
      continue;
    }

    let out = null;
    let ext = null;
    if (filters.includes("DCTDecode")) {
      out = raw;
      ext = "jpg";
      const info = jpegInfo(raw);
      if (info) Object.assign(record, { jpegWidth: info.width, jpegHeight: info.height });
    } else if (filters.length === 0 || (filters.length === 1 && filters[0] === "FlateDecode")) {
      const plain = filters.length === 0 ? raw : inflate(raw);
      if (!plain) {
        record.skipped = "inflate failed";
        found.push(record);
        continue;
      }
      const predictor = num(dict, "Predictor");
      let pixels = plain;
      const colors =
        num(dict, "Colors") ??
        (cs === "DeviceRGB" ? 3 : cs === "DeviceGray" ? 1 : cs === "DeviceCMYK" ? 4 : 3);
      const columns = num(dict, "Columns") ?? w;
      if (predictor && predictor >= 10) {
        pixels = undoPredictor(plain, colors, bpc, columns);
      }
      if (bpc !== 8) {
        pixels = expandBits(pixels, w, h, colors, bpc);
        record.bitsExpanded = true;
      }
      if (pixels.length < w * h * colors) {
        // Some encoders pad; pad with white rather than dropping the asset.
        const padded = Buffer.alloc(w * h * colors, 0xff);
        pixels.copy(padded);
        pixels = padded;
        record.padded = true;
      }
      out = pngEncode(w, h, colors, pixels);
      ext = "png";
      record.colorSpace = colors === 1 ? "Gray" : colors === 3 ? "RGB" : "CMYK-as-RGB";
    } else {
      record.skipped = `unsupported filter ${filters.join("+")}`;
      found.push(record);
      continue;
    }

    if (outDir) {
      const base = `${String(objNum).padStart(4, "0")}-${w}x${h}`;
      const target = path.join(outDir, `${base}.${ext}`);
      fs.writeFileSync(target, out);
      record.file = path.basename(target);
    }
    found.push(record);
  }

  const usable = found.filter((f) => f.file);
  const result = { file: path.basename(file), objects: objects.size, images: found, usable, problems };
  if (report) {
    const byFilter = {};
    for (const f of found) {
      const k = f.filters.join("+") || "raw";
      byFilter[k] = (byFilter[k] ?? 0) + 1;
    }
    console.log(`\n=== ${path.basename(file)} (${(buf.length / 1048576).toFixed(1)} MB, ${objects.size} objects)`);
    console.log(`    image XObjects: ${found.length}  |  filters: ${JSON.stringify(byFilter)}`);
    console.log(`    extracted: ${usable.length}`);
    for (const f of found) {
      const dims = `${f.width ?? "?"}x${f.height ?? "?"}`;
      console.log(
        `      obj ${String(f.obj).padStart(5)}  ${dims.padEnd(11)} ${String(f.bytes).padStart(8)}B  ${
          f.filters.join("+") || "raw"
        }  ${f.skipped ? "SKIP " + f.skipped : "ok"}`
      );
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  const keepAll = args.includes("--keep-all");
  const outIdx = args.indexOf("--out");
  const outDir = outIdx !== -1 ? args[outIdx + 1] : null;
  const minPxIdx = args.indexOf("--min-px");
  const minPx = minPxIdx !== -1 ? Number(args[minPxIdx + 1]) : 80;
  const skip = new Set(["report", "extract", "--keep-all", "--out", "--min-px", outDir]);
  const files = args.filter((a) => !skip.has(a) && !/^\d+$/.test(a));

  if (mode !== "report" && mode !== "extract") {
    console.error("usage: pdf-images.mjs report|extract <file.pdf ...> [--out DIR] [--keep-all] [--min-px N]");
    process.exit(1);
  }
  if (outDir) fs.mkdirSync(outDir, { recursive: true });

  const results = [];
  for (const file of files) {
    // One folder per source deck, so object numbers from different PDFs cannot collide.
    const slug = path
      .basename(file, ".pdf")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const dir = outDir ? path.join(outDir, slug) : null;
    if (dir) fs.mkdirSync(dir, { recursive: true });
    results.push(extractPdf(file, { outDir: dir, keepAll, minPx, report: mode === "report" }));
  }
  if (outDir) {
    fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(results, null, 2));
    const total = results.reduce((n, r) => n + r.usable.length, 0);
    console.log(`\nExtracted ${total} images into ${outDir}`);
  }
}

main();
