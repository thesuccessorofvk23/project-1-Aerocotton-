#!/usr/bin/env node
/**
 * Packs the built site into a single zip for upload.
 *
 *     npm run pack        # build, then pack
 *     node scripts/pack-upload.mjs
 *
 * `out/` is 540 small files spread over 14 folders. Dragging that across FTP is
 * slow and easy to get wrong, so this produces one archive that can be dropped
 * into the hosting file manager and extracted in place.
 *
 * Two details matter and are both checked below:
 *
 *   - the archive must contain the site's **contents at its root**, so that
 *     extracting it into the web root puts index.html at the site's address
 *     rather than one level down inside an `out/` folder;
 *   - the dotfiles must travel. `.htaccess` is what keeps `/api/lib/` (the file
 *     holding the mail password) from being downloadable, and a zip tool that
 *     quietly skips dotfiles would ship the site without that protection.
 *
 * The archive is written to the project root and is git-ignored: it is a full
 * copy of the site, so it should never be left on the server or in the repo.
 *
 * A stale archive is worse than no archive, so this sits behind `npm run pack`,
 * which rebuilds first, and the build's own output is what gets packed.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outDir = path.join(root, "out");
const zipPath = path.join(root, "aerocotton-site-upload.zip");

// Files that must be in the archive for the upload to be correct. Listed
// explicitly because each one is either invisible to a careless file manager
// or load-bearing for a feature that fails quietly.
const REQUIRED = [
  "index.html", // the site itself
  "404.html", // the not-found page
  ".htaccess", // Apache/LiteSpeed rules; also hides the credentials file
  "web.config", // the IIS equivalent, for hosts without .htaccess
  "api/submit.php", // the enquiry endpoint
  "api/lib/config.php", // the endpoint's configuration (mail settings)
  "api/.htaccess", // keeps api/lib/ private
  "sitemap.xml",
];

function fail(message) {
  console.error(`\n  pack-upload: ${message}\n`);
  process.exit(1);
}

if (!fs.existsSync(outDir) || fs.readdirSync(outDir).length === 0) {
  fail("out/ is missing or empty — run `npm run build` first.");
}

/** bsdtar is the one zip writer Windows ships. GNU tar (often ahead of it on
 *  PATH under Git Bash) accepts `-a -cf x.zip` and then writes a POSIX tar, so
 *  the System32 copy is preferred by full path and the result is always checked
 *  by its magic bytes below rather than trusted by the caller. */
const BSDTAR = "C:/Windows/System32/tar.exe";
const bsdtar = fs.existsSync(BSDTAR) ? BSDTAR : null;

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.error) return { ok: false, error: result.error.message };
  if (result.status !== 0) {
    return { ok: false, error: (result.stderr || result.stdout || "").trim() };
  }
  return { ok: true, stdout: result.stdout ?? "" };
}

fs.rmSync(zipPath, { force: true });

let packed = null;
if (bsdtar) {
  // -C out . keeps the archive rooted at the site's contents, dotfiles included.
  const result = run(bsdtar, ["-a", "-cf", zipPath, "-C", outDir, "."]);
  if (result.ok) packed = "bsdtar";
  else console.warn(`  bsdtar failed (${result.error}); trying PowerShell instead.`);
}

if (!packed) {
  const result = run("powershell", [
    "-NoProfile",
    "-Command",
    `Compress-Archive -Path '${outDir}\\*' -DestinationPath '${zipPath}' -Force`,
  ]);
  if (result.ok) packed = "Compress-Archive";
}

if (!packed || !fs.existsSync(zipPath)) {
  fail(
    "could not create the archive. Zip the *contents* of out/ yourself — every " +
      "file inside it, hidden ones (.htaccess) included — and upload that."
  );
}

// The extension is not evidence: GNU tar writes a tar under any name, and
// Compress-Archive silently omits hidden files. Both are caught here.
const magic = Buffer.alloc(4);
const handle = fs.openSync(zipPath, "r");
fs.readSync(handle, magic, 0, 4, 0);
fs.closeSync(handle);
if (magic.toString("latin1") !== "PK\u0003\u0004") {
  fail(
    `the archive is not a zip (found ${JSON.stringify(magic.toString("latin1"))}). ` +
      "Most hosting file managers can only extract real zips."
  );
}

const listing = run(bsdtar ?? "tar", ["-tf", zipPath]);
if (!listing.ok) fail(`the archive could not be read back: ${listing.error}`);
const entries = listing.stdout
  .split(/\r?\n/)
  .map((line) => line.replace(/^\.\//, "").trim())
  .filter(Boolean);
const entrySet = new Set(entries);

const missing = REQUIRED.filter((file) => !entrySet.has(file));
if (missing.length > 0) {
  fail(
    `the archive is missing ${missing.join(", ")}. Do not upload it — ` +
      "those files are either hidden or required by the site."
  );
}

const files = entries.filter((entry) => !entry.endsWith("/")).length;
const size = fs.statSync(zipPath).size;
const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;

console.log(`
  packed with ${packed} -> ${path.relative(root, zipPath)}
  ${files} files, ${mb(size)}

  Upload this single file into the hosting web root (the folder the domain
  points at), then extract it there and delete the archive:

    * cPanel / BigRock -> File Manager -> select the zip -> Extract
    * DirectAdmin     -> File Manager -> Extract
    * Plesk           -> Files -> Upload, then More -> Extract Files

  It must extract *into* the web root, so that its index.html becomes the
  site's front page. Do not extract it into a subfolder.

  Then confirm two things on the live site:

    1. https://<your-domain>/            -> the styled homepage
    2. https://<your-domain>/api/lib/config.php -> 404

  If #2 shows PHP source or the configuration, .htaccess is not being honoured
  and the mail settings are downloadable: stop and fix that before going live.
`);
