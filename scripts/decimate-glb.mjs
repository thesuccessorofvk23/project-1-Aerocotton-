#!/usr/bin/env node
/**
 * Prepare a heavy Tripo/Magic3D `.glb` scan for the web: decimate the mesh to a
 * target triangle budget with even spatial sampling (vertex clustering), keep
 * the original base-colour texture pixels verbatim so the print's colour does
 * not fade, and write a cloth-safe PBR material.
 *
 *   node scripts/decimate-glb.mjs in.glb --out public/models/foo.glb \
 *        --tris 75000 [--normals] [--bake-normals]
 *
 * What it does
 *   1. Reads the GLB's geometry (positions, normals, UVs, indices) directly
 *      from its binary chunk — no three.js needed on the CLI.
 *   2. Deindexes the mesh and clusters vertices on a 3D grid sized so the
 *      output lands near the requested triangle budget, averaging position,
 *      UV and normal per cell. Grid sampling keeps the silhouette even —
 *      unlike greedy edge-collapse, flat printed cloth does not thin out.
 *   3. Re-extracts the base-colour texture bytes byte-for-byte (no re-encode)
 *      and drops the ORM/normal maps unless asked; Tripo's ORM average
 *      (G≈0.5–0.7, metallicFactor 1) renders cotton as wet plastic, which is
 *      what makes the print look like its colour faded.
 *   4. Writes a fresh GLB: one mesh, one cloth-safe material
 *      (metal 0, roughness 0.94, double-sided), float32 attributes, Uint32
 *      indices, and the untouched texture.
 */
import fs from "node:fs";
import path from "node:path";

/* ----------------------------- args ----------------------------- */

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const hasFlag = (name) => args.includes(`--${name}`);
const out = flag("out", null);
const targetTris = Number(flag("tris", 75000));
const keepNormal = hasFlag("normals");
const bakeNormals = hasFlag("bake-normals");

if (!file || !out) {
  console.error("usage: node scripts/decimate-glb.mjs <in.glb> --out <out.glb> [--tris 75000] [--normals] [--bake-normals]");
  process.exit(1);
}

/* --------------------------- glb parse --------------------------- */

const raw = fs.readFileSync(file);
if (raw.toString("utf8", 0, 4) !== "glTF") throw new Error("not a GLB");

let json = null;
let binStart = 0;
{
  let off = 12;
  while (off + 8 <= raw.length) {
    const len = raw.readUInt32LE(off);
    const type = raw.toString("utf8", off + 4, off + 8);
    if (type.startsWith("JSON")) json = JSON.parse(raw.toString("utf8", off + 8, off + 8 + len));
    else if (type.startsWith("BIN")) binStart = off + 8;
    off += 8 + len;
  }
}
if (!json || !binStart) throw new Error("GLB missing JSON or BIN chunk");

const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const TYPED = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
};

/** Walk one accessor into a flat typed array, honouring byteStride. */
function readAccessor(index) {
  const accessor = json.accessors[index];
  const view = json.bufferViews[accessor.bufferView];
  const Ctor = TYPED[accessor.componentType];
  const size = COMPONENTS[accessor.type];
  const stride = view.byteStride ?? Ctor.BYTES_PER_ELEMENT * size;
  const base = binStart + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const data = new Ctor(accessor.count * size);
  for (let i = 0; i < accessor.count; i++) {
    for (let c = 0; c < size; c++) {
      data[i * size + c] = new Ctor(raw.buffer, raw.byteOffset + base + i * stride + c * Ctor.BYTES_PER_ELEMENT, 1)[0];
    }
  }
  return { data, size, count: accessor.count };
}

const mesh = json.meshes[0];
const prim = mesh.primitives[0];
const posAcc = readAccessor(prim.attributes.POSITION);
const nrmAcc = prim.attributes.NORMAL !== undefined ? readAccessor(prim.attributes.NORMAL) : null;
const uvAcc = prim.attributes.TEXCOORD_0 !== undefined ? readAccessor(prim.attributes.TEXCOORD_0) : null;
const idxAcc = prim.indices !== undefined ? readAccessor(prim.indices) : null;

const inTris = (idxAcc ? idxAcc.count : posAcc.count) / 3;
console.log(`in: ${path.basename(file)} — ${posAcc.count.toLocaleString()} verts, ${inTris.toLocaleString()} tris`);

/* ----------------------- deindex + bounds ------------------------ */

const idxData = idxAcc ? idxAcc.data : null;
const triCount = Math.floor(inTris);
const positions = new Float32Array(triCount * 9);
const uvs = uvAcc ? new Float32Array(triCount * 6) : null;
const normals = nrmAcc ? new Float32Array(triCount * 9) : null;

const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];

for (let t = 0; t < triCount; t++) {
  for (let c = 0; c < 3; c++) {
    const vi = idxData ? idxData[t * 3 + c] : t * 3 + c;
    for (let a = 0; a < 3; a++) {
      const v = posAcc.data[vi * 3 + a];
      positions[t * 9 + c * 3 + a] = v;
      if (v < min[a]) min[a] = v;
      if (v > max[a]) max[a] = v;
    }
    if (uvs) for (let a = 0; a < 2; a++) uvs[t * 6 + c * 2 + a] = uvAcc.data[vi * 2 + a];
    if (normals) for (let a = 0; a < 3; a++) normals[t * 9 + c * 3 + a] = nrmAcc.data[vi * 3 + a];
  }
}

const extent = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;

/* --------------------- cluster decimation ----------------------- */
/* Grid cell chosen so the expected unique-cell count ≈ target vertex
 * count (≈ ½·targetTris for a closed-ish surface; scans sit near that).
 * Cells fill unevenly, so the real count lands within ~±25% — good enough
 * for a viewer budget, and it never under-samples thin cloth. */

/* Cluster with a given cell size; returns {cells, tris}. Auto-tuned below:
 * real scans are rarely cube-shaped (cloth is a shell), so the cbrt estimate
 * is refined against the measured output instead of trusting it. */
function cluster(cellSize) {
  const cells = new Map();
  const tris = [];
  for (let t = 0; t < triCount; t++) {
    const corner = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      const o = t * 9 + c * 3;
      const k =
        `${Math.floor(positions[o] / cellSize)},` +
        `${Math.floor(positions[o + 1] / cellSize)},` +
        `${Math.floor(positions[o + 2] / cellSize)}`;
      let acc = cells.get(k);
      if (!acc) {
        acc = { x: 0, y: 0, z: 0, u: 0, v: 0, nx: 0, ny: 0, nz: 0, n: 0, index: cells.size };
        cells.set(k, acc);
      }
      acc.x += positions[o]; acc.y += positions[o + 1]; acc.z += positions[o + 2];
      if (uvs) { const p = t * 6 + c * 2; acc.u += uvs[p]; acc.v += uvs[p + 1]; }
      if (normals) { const p = t * 9 + c * 3; acc.nx += normals[p]; acc.ny += normals[p + 1]; acc.nz += normals[p + 2]; }
      acc.n++;
      corner[c] = acc.index;
    }
    // Drop triangles that collapsed to a point/line in the grid.
    const [A, B, C] = corner;
    if (A !== B && B !== C && A !== C) tris.push([A, B, C]);
  }
  return { cells, tris };
}

const targetVerts = Math.round(targetTris * 0.55);
let cell = extent / Math.cbrt(Math.max(1, targetVerts));
let { cells: clusters, tris: outTriangles } = cluster(cell);
for (let pass = 0; pass < 4; pass++) {
  const ratio = outTriangles.length / targetTris;
  if (ratio > 0.8 && ratio < 1.25) break;
  // Triangle count scales ≈ 1/cell² for shells, ≈ 1/cell³ for solids —
  // steer with the measured exponent between the two.
  cell *= Math.pow(ratio, 0.4);
  ({ cells: clusters, tris: outTriangles } = cluster(cell));
}

const outVerts = clusters.size;
const outTris = outTriangles.length;

const outPos = new Float32Array(outVerts * 3);
const outUv = new Float32Array(outVerts * 2);
const outNrm = new Float32Array(outVerts * 3);
for (const acc of clusters.values()) {
  outPos[acc.index * 3] = acc.x / acc.n;
  outPos[acc.index * 3 + 1] = acc.y / acc.n;
  outPos[acc.index * 3 + 2] = acc.z / acc.n;
  if (uvAcc) { outUv[acc.index * 2] = acc.u / acc.n; outUv[acc.index * 2 + 1] = acc.v / acc.n; }
  if (normals && !bakeNormals) {
    const l = Math.hypot(acc.nx, acc.ny, acc.nz) || 1;
    outNrm[acc.index * 3] = acc.nx / l;
    outNrm[acc.index * 3 + 1] = acc.ny / l;
    outNrm[acc.index * 3 + 2] = acc.nz / l;
  }
}

/* Recompute smooth normals from the decimated mesh when asked (grid
 * averaging across sharp creases can smear them). */
if (bakeNormals || !nrmAcc) {
  const fnrm = new Float32Array(outVerts * 3);
  for (const [A, B, C] of outTriangles) {
    const ax = outPos[A.index * 3], ay = outPos[A.index * 3 + 1], az = outPos[A.index * 3 + 2];
    const bx = outPos[B.index * 3], by = outPos[B.index * 3 + 1], bz = outPos[B.index * 3 + 2];
    const cx = outPos[C.index * 3], cy = outPos[C.index * 3 + 1], cz = outPos[C.index * 3 + 2];
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    for (const V of [A, B, C]) {
      fnrm[V.index * 3] += nx; fnrm[V.index * 3 + 1] += ny; fnrm[V.index * 3 + 2] += nz;
    }
  }
  for (let i = 0; i < outVerts; i++) {
    const l = Math.hypot(fnrm[i * 3], fnrm[i * 3 + 1], fnrm[i * 3 + 2]) || 1;
    outNrm[i * 3] = fnrm[i * 3] / l;
    outNrm[i * 3 + 1] = fnrm[i * 3 + 1] / l;
    outNrm[i * 3 + 2] = fnrm[i * 3 + 2] / l;
  }
}

/* ------------------------ texture bytes ------------------------- */
/* Re-embed the base-colour texture EXACTLY as shipped — no re-encode, no
 * resize, no colour management. The print keeps its pixels; the viewer
 * keeps its colour. */

const material = (json.materials ?? [])[prim.material ?? 0];
const baseTexIndex = material?.pbrMetallicRoughness?.baseColorTexture?.index;
let imageBytes = null;
let imageMime = "image/jpeg";
if (baseTexIndex !== undefined) {
  const image = json.images[json.textures[baseTexIndex].source];
  const view = json.bufferViews[image.bufferView];
  const base = binStart + (view.byteOffset ?? 0);
  imageBytes = raw.subarray(base, base + view.byteLength);
  imageMime = image.mimeType ?? "image/jpeg";
  console.log(`texture: ${imageMime} ${(imageBytes.length / 1024).toFixed(0)} KB — copied verbatim`);
} else {
  console.warn("no base-colour texture found — output will be untextured");
}

/* --------------------------- glb write --------------------------- */

const pad4 = (n) => (4 - (n % 4)) % 4;

const posBytes = Buffer.from(outPos.buffer, 0, outVerts * 12);
const uvBytes = Buffer.from(outUv.buffer, 0, outVerts * 8);
const nrmBytes = Buffer.from(outNrm.buffer, 0, outVerts * 12);
const flat = outTriangles.flat();
const indexArray = outVerts < 65536 ? Uint16Array.from(flat) : Uint32Array.from(flat);
const idxBytes = Buffer.from(indexArray.buffer, 0, indexArray.byteLength);

const binViews = [];
let cursor = 0;
const pushView = (buf) => {
  cursor += pad4(cursor); // every view 4-byte aligned
  binViews.push({ buffer: buf, byteOffset: cursor, byteLength: buf.byteLength });
  cursor += buf.byteLength;
};
pushView(posBytes);
pushView(uvBytes);
pushView(nrmBytes);
pushView(idxBytes);
let imageOffset = null;
if (imageBytes) {
  pushView(imageBytes);
  imageOffset = binViews[binViews.length - 1];
}

const binChunk = Buffer.alloc(cursor);
for (const v of binViews) v.buffer.copy(binChunk, v.byteOffset);

const images = imageBytes
  ? [{ bufferView: 4, mimeType: imageMime, name: "Color_verbatim" }]
  : [];
const textures = imageBytes ? [{ source: 0, sampler: 0 }] : [];
const materials = [
  {
    name: "cotton_cloth",
    pbrMetallicRoughness: {
      baseColorFactor: [1, 1, 1, 1],
      ...(imageBytes ? { baseColorTexture: { index: 0 } } : {}),
      metallicFactor: 0,      // cloth is not metal — full metal kills albedo
      roughnessFactor: 0.94,  // matte cotton, no plastic sheen
    },
    doubleSided: true, // open scan shell: render both faces
  },
];

const outJson = {
  asset: { version: "2.0", generator: "aerocotton decimate-glb.mjs" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: "product" }],
  meshes: [
    {
      name: "product",
      primitives: [
        {
          attributes: { POSITION: 0, TEXCOORD_0: 1, NORMAL: 2 },
          indices: 3,
          material: 0,
          mode: 4,
        },
      ],
    },
  ],
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: outVerts,
      type: "VEC3",
      min: [...min],
      max: [...max],
    },
    { bufferView: 1, componentType: 5126, count: outVerts, type: "VEC2" },
    { bufferView: 2, componentType: 5126, count: outVerts, type: "VEC3" },
    {
      bufferView: 3,
      componentType: outVerts < 65536 ? 5123 : 5125,
      count: outTris * 3,
      type: "SCALAR",
    },
  ],
  materials,
  ...(images.length ? { images, textures, samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }] } : {}),
  buffers: [{ byteLength: binChunk.byteLength }],
  bufferViews: binViews.map((v, i) => ({
    buffer: 0,
    byteOffset: v.byteOffset,
    byteLength: v.byteLength,
    ...(i === (imageOffset ? 4 : -1) ? {} : {}),
  })),
};

let jsonChunk = Buffer.from(JSON.stringify(outJson), "utf8");
jsonChunk = Buffer.concat([jsonChunk, Buffer.alloc(pad4(jsonChunk.length), 0x20)]);
const binPadded = Buffer.concat([binChunk, Buffer.alloc(pad4(binChunk.length))]);

const total = 12 + 8 + jsonChunk.length + 8 + binPadded.length;
const glb = Buffer.alloc(total);
glb.write("glTF", 0, "ascii");
glb.writeUInt32LE(2, 4);
glb.writeUInt32LE(total, 8);
glb.writeUInt32LE(jsonChunk.length, 12);
glb.write("JSON", 16, "ascii");
jsonChunk.copy(glb, 20);
const binHead = 20 + jsonChunk.length;
glb.writeUInt32LE(binPadded.length, binHead);
glb.write("BIN\0", binHead + 4, "ascii");
binPadded.copy(glb, binHead + 8);

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, glb);

console.log(
  `out: ${out} — ${outVerts.toLocaleString()} verts, ${outTris.toLocaleString()} tris ` +
    `(${((outTris / triCount) * 100).toFixed(1)}% of source), ${(glb.length / 1024 / 1024).toFixed(2)} MB`
);
