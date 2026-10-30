#!/usr/bin/env node
/**
 * Flattens the static export's per-segment RSC payload filenames.
 *
 * Next writes each segment payload as `__next<segmentPath, with / → .>.txt`:
 *
 *   out/about/__next.about.__PAGE__.txt
 *   out/products/nature/__next.products.$d$collection.$d$product.__PAGE__.txt
 *
 * and the client router prefetches exactly those names, relative to the route
 * directory. The name is built from `path.relative()` output, which on Windows
 * is backslash-separated, while the conversion that turns it into a filename
 * only replaces `/`:
 *
 *   convertSegmentPathToStaticExportFilename('/about\\__PAGE__')
 *     -> '__next.about\\__PAGE__.txt'
 *
 * Because `\` *is* a path separator on Windows, those payloads land in nested
 * directories instead of one dotted file:
 *
 *   out/about/__next.about/__PAGE__.txt          (what Windows gets)
 *   out/about/__next.about.__PAGE__.txt          (what the client requests)
 *
 * Every such prefetch then 404s, and client-side navigation falls back to a
 * full page load. Nothing else about the export is wrong — the payload bytes
 * are complete and correct — so this repairs the paths and nothing more.
 *
 * Windows-only: a Linux build of the same source produces the dotted names
 * already, which is why this is a no-op there (`path.relative` yields `/`, and
 * the conversion handles it). Run it after `next build`, and treat its exit
 * status as part of the build: if a payload cannot be placed at the name the
 * client asks for, the artifact is not deployable.
 *
 *   node scripts/normalize-segment-payloads.mjs [--dir out]
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const root = path.resolve(flag("dir", "out"));

/** Every path under `dir`, deepest last, as directories then files. */
const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const dirs = [];
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) dirs.push(full);
    else if (entry.isFile()) files.push(full);
  }
  return { dirs, files };
};

/** Every file under `dir`, at any depth. */
const collectFiles = (dir) => {
  const files = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) files.push(full);
    }
  };
  visit(dir);
  return files;
};

const repairs = [];
const problems = [];

/**
 * A mangled payload is a directory named `__next.…` holding the rest of the
 * name as further path segments. Its flattened name is every segment joined
 * by `.`, moved up to sit beside the route's `index.html`.
 */
const flatten = (dir) => {
  const parent = path.dirname(dir);
  for (const file of collectFiles(dir)) {
    const relative = path.relative(dir, file).split(path.sep).join(".");
    const flatName = `${path.basename(dir)}.${relative}`;
    const destination = path.join(parent, flatName);
    if (fs.existsSync(destination)) {
      // A rebuild can leave the previous, correctly-named file behind. Same
      // bytes means this is that case; different bytes means a real collision.
      const same =
        fs.statSync(destination).size === fs.statSync(file).size &&
        fs.readFileSync(destination).equals(fs.readFileSync(file));
      if (!same) problems.push(`collision: ${destination} already exists with different contents`);
      fs.rmSync(file);
      repairs.push(flatName);
      continue;
    }
    fs.renameSync(file, destination);
    repairs.push(flatName);
  }
  // The tree only ever held the segments that make up `flatName`, so it goes.
  fs.rmSync(dir, { recursive: true, force: true });
};

const findMangled = (dir) => {
  const { dirs } = walk(dir);
  for (const sub of dirs) {
    // Never descend into the chunk directory; payloads live beside the pages.
    if (path.basename(sub) === "_next") continue;
    if (path.basename(sub).startsWith("__next.")) {
      flatten(sub);
      continue;
    }
    findMangled(sub);
  }
};

if (!fs.existsSync(root)) {
  console.error(`normalize-segment-payloads: ${root} does not exist — run the build first`);
  process.exit(1);
}

findMangled(root);

const leftover = [];
const check = (dir) => {
  for (const { name } of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (!stat.isDirectory()) continue;
    if (name === "_next") continue;
    if (name.startsWith("__next.")) leftover.push(full);
    else check(full);
  }
};
check(root);

if (problems.length > 0) {
  for (const problem of problems) console.error(`normalize-segment-payloads: ${problem}`);
  process.exit(1);
}

console.log(
  repairs.length === 0
    ? "normalize-segment-payloads: payload names already correct (no-op)"
    : `normalize-segment-payloads: flattened ${repairs.length} segment payload path(s)`,
);
if (leftover.length > 0) {
  console.error(
    `normalize-segment-payloads: ${leftover.length} payload path(s) still nested, first: ${leftover[0]}`,
  );
  process.exit(1);
}
