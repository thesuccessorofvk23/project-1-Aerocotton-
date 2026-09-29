#!/usr/bin/env node
/**
 * Serves the static export in `out/` the way a static host would, so the built
 * site can be checked before it is pushed — a different thing from `next dev`,
 * because the export is plain files with no server runtime.
 *
 *   node scripts/serve-export.mjs [--port 4181] [--dir out]
 *
 * Resolves a directory to its `index.html` (the export uses `trailingSlash`),
 * and falls back to `404.html` for anything missing.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const port = Number(flag("port", 4181));
const root = path.resolve(flag("dir", "out"));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".obj": "text/plain; charset=utf-8",
  ".glb": "model/gltf-binary",
};

const resolveFile = (urlPath) => {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const target = path.join(root, clean);
  if (!target.startsWith(root)) return null; // no climbing out of the export
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    const index = path.join(target, "index.html");
    return fs.existsSync(index) ? index : null;
  }
  return fs.existsSync(target) ? target : null;
};

http
  .createServer((req, res) => {
    const file = resolveFile(req.url ?? "/");
    const send = (p, status) => {
      res.writeHead(status, { "content-type": TYPES[path.extname(p)] ?? "application/octet-stream" });
      fs.createReadStream(p).pipe(res);
    };
    if (file) return send(file, 200);
    const fallback = path.join(root, "404.html");
    if (fs.existsSync(fallback)) return send(fallback, 404);
    res.writeHead(404).end("not found");
  })
  .listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
