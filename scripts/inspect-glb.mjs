/**
 * Print a GLB's JSON chunk summary — meshes, materials, images — plus a few
 * binary stats. Usage: node scripts/inspect-glb.mjs <file.glb> [...]
 */
import { readFileSync } from "node:fs";

for (const path of process.argv.slice(2)) {
  const buf = readFileSync(path);
  const magic = buf.readUInt32LE(0);
  const version = buf.readUInt32LE(4);
  if (magic !== 0x46546c67) {
    console.log(`${path}: not a GLB (magic ${magic.toString(16)})`);
    continue;
  }
  const jsonLen = buf.readUInt32LE(12);
  const jsonType = buf.readUInt32LE(16);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));

  console.log(`\n=== ${path} ===`);
  console.log(`glTF ${version}, file ${(buf.length / 1024 / 1024).toFixed(2)} MB, JSON ${(jsonLen / 1024).toFixed(0)} KB (chunk type 0x${jsonType.toString(16)})`);
  console.log(`generator: ${json.asset?.generator ?? "unknown"}`);
  console.log(`nodes: ${json.nodes?.length ?? 0}, meshes: ${json.meshes?.length ?? 0}, materials: ${json.materials?.length ?? 0}, textures: ${json.textures?.length ?? 0}, images: ${json.images?.length ?? 0}`);

  const prims = (json.meshes ?? []).map((m) => m.primitives?.length ?? 0).reduce((a, b) => a + b, 0);
  console.log(`primitives: ${prims}`);

  for (const [i, m] of (json.meshes ?? []).entries()) {
    const tris = m.primitives?.reduce((acc, p) => {
      const accIdx = json.accessors?.[p.indices]?.count ?? 0;
      return acc + accIdx / 3;
    }, 0) ?? 0;
    console.log(`  mesh[${i}] "${m.name ?? "?"}" — ${m.primitives?.length ?? 0} prims, ${(tris / 1000).toFixed(1)}k tris`);
  }
  for (const [i, m] of (json.materials ?? []).entries()) {
    const pbr = m.pbrMetallicRoughness ?? {};
    console.log(`  mat[${i}] "${m.name ?? "?"}" baseColor=${JSON.stringify(pbr.baseColorFactor ?? [1,1,1,1])} tex=${pbr.baseColorTexture ? "yes" : "no"} metal=${pbr.metallicFactor ?? 1} rough=${pbr.roughnessFactor ?? 1}`);
  }
  for (const [i, img] of (json.images ?? []).entries()) {
    const bufView = json.bufferViews?.[img.bufferView];
    console.log(`  image[${i}] "${img.name ?? img.uri ?? "?"}" mime=${img.mimeType} ${bufView ? `${(bufView.byteLength / 1024).toFixed(0)} KB` : ""}`);
  }
  if (json.extensionsUsed?.length) console.log(`extensionsUsed: ${json.extensionsUsed.join(", ")}`);
  if (json.extensionsRequired?.length) console.log(`extensionsRequired: ${json.extensionsRequired.join(", ")}`);
}
