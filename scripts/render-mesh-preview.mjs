#!/usr/bin/env node
/**
 * Renders a Wavefront `.obj` or a binary glTF `.glb` with a tiny software
 * rasteriser (Node has no WebGL) so a model can be identified, checked, and
 * turned into a card thumbnail before it is wired into the site.
 *
 *   node scripts/render-mesh-preview.mjs <model.glb> --out sheet.jpg           # 4 angles
 *   node scripts/render-mesh-preview.mjs <model.obj> --out thumb.jpg --yaw -1 --pitch 0.2 \
 *        --w 900 --h 1125 --bg f5f1ea --tint cfc3ae --zoom 0.84
 *
 * `--yaw`/`--pitch` frame one specific angle; `--views` (0–3 or "all") picks
 * from the four canned angles. `--flat` forces the tint path (no texture) for
 * a quick silhouette read.
 *
 * Shading is Gouraud: the model's own vertex normals are interpolated per pixel
 * and lit by a key + fill pair, so a low-poly scan reads as a soft clay render
 * rather than faceted triangles. A GLB's embedded base-colour texture is sampled
 * per pixel through its UVs, so a Tripo/Magic3D scan keeps its print.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const hasFlag = (name) => args.includes(`--${name}`);
const out = flag("out", ".pdf-work/model-preview.jpg");
const width = Number(flag("w", 900));
const height = Number(flag("h", width));
const wanted = flag("views", "all"); // "all" → contact sheet, else view index
const bg = flag("bg", "f4f0e8");
const tint = flag("tint", "cfc3ae");
const zoom = Number(flag("zoom", 0.78));
const flat = hasFlag("flat");

const hex = (h) => [
  parseInt(h.slice(0, 2), 16) / 255,
  parseInt(h.slice(2, 4), 16) / 255,
  parseInt(h.slice(4, 6), 16) / 255,
];

/* ============================== loaders ============================== */

const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const TYPED = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
};

/** Walks one glTF accessor into a flat array (honours byteStride). */
function readAccessor(json, bin, index) {
  const accessor = json.accessors[index];
  const view = json.bufferViews[accessor.bufferView];
  const Ctor = TYPED[accessor.componentType];
  const size = COMPONENTS[accessor.type];
  const stride = view.byteStride ?? Ctor.BYTES_PER_ELEMENT * size;
  const base = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const out = new Ctor(accessor.count * size);
  for (let i = 0; i < accessor.count; i++) {
    for (let c = 0; c < size; c++) {
      out[i * size + c] = new Ctor(bin.buffer, bin.byteOffset + base + i * stride + c * Ctor.BYTES_PER_ELEMENT, 1)[0];
    }
  }
  return { data: out, size, count: accessor.count };
}

/** glTF node transform — matrix, or translation/rotation/scale composed. */
function nodeMatrix(node) {
  if (!node) return null;
  if (node.matrix) return node.matrix;
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const [qx, qy, qz, qw] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz;
  const xx = qx * x2, xy = qx * y2, xz = qx * z2;
  const yy = qy * y2, yz = qy * z2, zz = qz * z2;
  const wx = qw * x2, wy = qw * y2, wz = qw * z2;
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

const applyMatrix = (m, p) =>
  m
    ? [
        m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
        m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
        m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
      ]
    : p;

const applyMatrixDir = (m, p) =>
  m
    ? [
        m[0] * p[0] + m[4] * p[1] + m[8] * p[2],
        m[1] * p[0] + m[5] * p[1] + m[9] * p[2],
        m[2] * p[0] + m[6] * p[1] + m[10] * p[2],
      ]
    : p;

/** Reads a `.glb` — geometry, plus its embedded base-colour texture. */
async function loadGlb(buffer) {
  if (buffer.toString("utf8", 0, 4) !== "glTF") throw new Error("not a GLB (no glTF magic)");
  let offset = 12;
  let json = null;
  let bin = null;
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.toString("utf8", offset + 4, offset + 8);
    if (type.startsWith("JSON")) json = JSON.parse(buffer.toString("utf8", offset + 8, offset + 8 + length));
    else if (type.startsWith("BIN")) bin = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 8 + length;
  }
  if (!json || !bin) throw new Error("GLB is missing its JSON or BIN chunk");

  const prim = json.meshes[0].primitives[0];
  const node = (json.nodes ?? []).find((n) => n.mesh === 0);
  const matrix = nodeMatrix(node);

  const position = readAccessor(json, bin, prim.attributes.POSITION);
  const normal = prim.attributes.NORMAL !== undefined ? readAccessor(json, bin, prim.attributes.NORMAL) : null;
  const uv = prim.attributes.TEXCOORD_0 !== undefined ? readAccessor(json, bin, prim.attributes.TEXCOORD_0) : null;
  const index = prim.indices !== undefined ? readAccessor(json, bin, prim.indices) : null;

  const positions = [];
  for (let i = 0; i < position.count; i++) {
    positions.push(applyMatrix(matrix, [position.data[i * 3], position.data[i * 3 + 1], position.data[i * 3 + 2]]));
  }
  const normals = normal
    ? Array.from({ length: normal.count }, (_, i) =>
        applyMatrixDir(matrix, [normal.data[i * 3], normal.data[i * 3 + 1], normal.data[i * 3 + 2]])
      )
    : null;
  const uvs = uv ? Array.from({ length: uv.count }, (_, i) => [uv.data[i * 2], uv.data[i * 2 + 1]]) : null;

  const triangles = [];
  const order = index ? Array.from(index.data) : positions.map((_, i) => i);
  for (let i = 0; i + 2 < order.length; i += 3) triangles.push([order[i], order[i + 1], order[i + 2]]);

  /* Base-colour texture → raw RGBA we can sample by UV. */
  let texture = null;
  const material = (json.materials ?? [])[prim.material ?? 0];
  const textureIndex = material?.pbrMetallicRoughness?.baseColorTexture?.index;
  if (!flat && textureIndex !== undefined) {
    const imageIndex = json.textures[textureIndex].source;
    const image = json.images[imageIndex];
    const view = json.bufferViews[image.bufferView];
    const bytes = bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
    const { data, info } = await sharp(Buffer.from(bytes)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    texture = { data, width: info.width, height: info.height };
    console.log(`  base-colour texture: ${image.mimeType} ${info.width}×${info.height}`);
  }

  return { positions, normals, uvs, triangles, texture, source: path.basename(file) };
}

/** Reads a `.obj` — the original dependency-free path. */
function loadObj(text) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const triangles = [];
  for (const line of text.split("\n")) {
    if (line.startsWith("v ")) {
      const [x, y, z] = line.slice(2).trim().split(/\s+/).map(Number);
      positions.push([x, y, z]);
    } else if (line.startsWith("vn ")) {
      const [x, y, z] = line.slice(3).trim().split(/\s+/).map(Number);
      normals.push([x, y, z]);
    } else if (line.startsWith("vt ")) {
      const [u, v] = line.slice(3).trim().split(/\s+/).map(Number);
      uvs.push([u, v]);
    } else if (line.startsWith("f ")) {
      const refs = line
        .slice(2)
        .trim()
        .split(/\s+/)
        .map((token) => {
          const [v, t, n] = token.split("/");
          return { v: Number(v) - 1, t: t ? Number(t) - 1 : -1, n: n ? Number(n) - 1 : -1 };
        })
        .filter((r) => Number.isInteger(r.v) && r.v >= 0 && r.v < positions.length);
      for (let i = 1; i + 1 < refs.length; i++) triangles.push([refs[0], refs[i], refs[i + 1]]);
    }
  }
  return {
    positions,
    normals: normals.length ? normals : null,
    uvs: uvs.length ? uvs : null,
    triangles,
    texture: null,
    source: path.basename(file),
  };
}

/* ============================ normalise ============================ */

const raw = fs.readFileSync(file);
const ext = path.extname(file).toLowerCase();
const mesh = ext === ".glb" || ext === ".gltf" ? await loadGlb(raw) : loadObj(raw.toString("utf8"));

if (!mesh.positions.length || !mesh.triangles.length) {
  console.error("no geometry found in", file);
  process.exit(1);
}

const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
for (const p of mesh.positions) {
  for (let i = 0; i < 3; i++) {
    min[i] = Math.min(min[i], p[i]);
    max[i] = Math.max(max[i], p[i]);
  }
}
const center = min.map((v, i) => (v + max[i]) / 2);
const extent = Math.max(...max.map((v, i) => v - min[i])) || 1;
const unit = mesh.positions.map((p) => p.map((v, i) => (v - center[i]) / extent));

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/* ============================== render ============================== */

const allViews = [
  { name: "front 3/4", yaw: -0.5, pitch: 0.22 },
  { name: "front", yaw: 0, pitch: 0.05 },
  { name: "side", yaw: -1.35, pitch: 0.22 },
  { name: "top", yaw: -0.5, pitch: 1.1 },
];
const yawFlag = flag("yaw", null);
const pitchFlag = flag("pitch", null);
const views =
  yawFlag !== null
    ? [{ name: "custom", yaw: Number(yawFlag), pitch: pitchFlag === null ? 0.15 : Number(pitchFlag) }]
    : wanted === "all"
      ? allViews
      : [allViews[Number(wanted)] ?? allViews[0]];

const bgRgb = hex(bg);
const tintRgb = hex(tint);
const key = norm([-0.5, 0.62, 0.6]);
const fill = norm([0.75, -0.15, 0.65]);

const sampleTexture = (tex, u, v) => {
  const wrap = (t) => t - Math.floor(t);
  const x = Math.min(tex.width - 1, Math.max(0, Math.round(wrap(u) * (tex.width - 1))));
  const y = Math.min(tex.height - 1, Math.max(0, Math.round(wrap(v) * (tex.height - 1))));
  const i = (y * tex.width + x) * 4;
  return [tex.data[i] / 255, tex.data[i + 1] / 255, tex.data[i + 2] / 255];
};

const tiles = views.map(({ yaw, pitch }) => {
  const img = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    img[i * 3] = Math.round(bgRgb[0] * 255);
    img[i * 3 + 1] = Math.round(bgRgb[1] * 255);
    img[i * 3 + 2] = Math.round(bgRgb[2] * 255);
  }
  const depth = new Float32Array(width * height).fill(-Infinity);

  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const rot = (p) => {
    const x1 = p[0] * cy - p[2] * sy;
    const z1 = p[0] * sy + p[2] * cy;
    const y1 = p[1] * cp - z1 * sp;
    const z2 = p[1] * sp + z1 * cp;
    return [x1, y1, z2];
  };
  const pos = unit.map(rot);
  const nrm = mesh.normals ? mesh.normals.map(rot) : null;
  const toScreen = (p) => [
    Math.round((p[0] * zoom + 0.5) * width),
    Math.round((0.5 - p[1] * zoom) * height),
  ];

  for (const [i0, i1, i2] of mesh.triangles) {
    const pa = pos[i0], pb = pos[i1], pc = pos[i2];
    const n0 = nrm?.[i0] ?? null, n1 = nrm?.[i1] ?? null, n2 = nrm?.[i2] ?? null;
    const flat = (() => {
      const n = norm(cross(sub(pb, pa), sub(pc, pa)));
      return n[2] < 0 ? [-n[0], -n[1], -n[2]] : n;
    })();

    const [ax, ay] = toScreen(pa);
    const [bx, by] = toScreen(pb);
    const [cx, cyy] = toScreen(pc);
    const minX = Math.max(0, Math.min(ax, bx, cx));
    const maxX = Math.min(width - 1, Math.max(ax, bx, cx));
    const minY = Math.max(0, Math.min(ay, by, cyy));
    const maxY = Math.min(height - 1, Math.max(ay, by, cyy));
    const area = (bx - ax) * (cyy - ay) - (by - ay) * (cx - ax);
    if (area === 0) continue;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const w0 = ((bx - x) * (cyy - y) - (by - y) * (cx - ax)) / area;
        const w1 = ((cx - x) * (ay - y) - (cyy - y) * (ax - x)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * pa[2] + w1 * pb[2] + w2 * pc[2];
        const idx = y * width + x;
        if (z <= depth[idx]) continue;
        depth[idx] = z;

        let n = flat;
        if (n0 && n1 && n2) {
          n = norm([
            w0 * n0[0] + w1 * n1[0] + w2 * n2[0],
            w0 * n0[1] + w1 * n1[1] + w2 * n2[1],
            w0 * n0[2] + w1 * n1[2] + w2 * n2[2],
          ]);
        }
        const lambert = Math.max(0, dot(n, key)) * 0.85 + Math.max(0, dot(n, fill)) * 0.28;

        let rgb = tintRgb;
        if (mesh.texture && mesh.uvs) {
          const u0 = mesh.uvs[i0], u1 = mesh.uvs[i1], u2 = mesh.uvs[i2];
          rgb = sampleTexture(
            mesh.texture,
            w0 * u0[0] + w1 * u1[0] + w2 * u2[0],
            w0 * u0[1] + w1 * u1[1] + w2 * u2[1]
          );
          // Gentle lighting: enough to read the form, not enough to fight the print.
          const shade = 0.55 + 0.6 * Math.min(1, lambert);
          const j = idx * 3;
          for (let c = 0; c < 3; c++) {
            img[j + c] = Math.max(0, Math.min(255, Math.round(rgb[c] * shade * 255)));
          }
          continue;
        }

        const intensity = 0.34 + 0.78 * Math.min(1, lambert);
        const j = idx * 3;
        for (let c = 0; c < 3; c++) {
          img[j + c] = Math.max(0, Math.min(255, Math.round(rgb[c] * intensity * 255)));
        }
      }
    }
  }
  return img;
});

/* ============================ assemble ============================ */

const cols = tiles.length === 1 ? 1 : 2;
const rows = Math.ceil(tiles.length / cols);
const sheet = Buffer.alloc(cols * width * rows * height * 3);
for (let i = 0; i < tiles.length; i++) {
  const cx = (i % cols) * width;
  const cy = Math.floor(i / cols) * height;
  for (let y = 0; y < height; y++) {
    tiles[i].copy(sheet, ((cy + y) * cols * width + cx) * 3, y * width * 3, (y + 1) * width * 3);
  }
}
fs.mkdirSync(path.dirname(out), { recursive: true });
await sharp(sheet, { raw: { width: cols * width, height: rows * height, channels: 3 } })
  .jpeg({ quality: 88, progressive: true, mozjpeg: true })
  .toFile(out);

console.log(
  `${mesh.source}: ${mesh.positions.length} vertices, ${mesh.triangles.length} triangles` +
    `${mesh.texture ? " (textured)" : ""} → ${out} (${cols * width}x${rows * height})`
);
