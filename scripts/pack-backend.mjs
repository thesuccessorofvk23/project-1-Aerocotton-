#!/usr/bin/env node
/**
 * Pack the contact-form backend for upload, on its own.
 *
 *     npm run pack:api
 *
 * The site is already live in `httpdocs`, so nothing here rebuilds it. This
 * assembles only the files the endpoint needs, laid out so the archive's
 * contents can be extracted straight into `httpdocs`:
 *
 *     api-package/            the tree, for review before uploading
 *     api-package/MANIFEST.json   every file, its destination and its action
 *     aerocotton-api-upload.zip   the same tree as one archive
 *
 * It deliberately does NOT contain:
 *
 *   - anything from `out/`: the deployed site is not repackaged, and its
 *     index.html is never at risk from this script
 *   - `api/config.php`, the credentials file. It is excluded by name, and the
 *     archive is scanned afterwards for a filled-in password as a second check.
 *     Credentials are typed on the server, not uploaded.
 *   - the endpoint's runtime directories (`data/`, `logs/`): the host creates
 *     them, with their own .htaccess, on the first submission
 *   - `.htaccess` files are kept where they belong, because they are what keeps
 *     `api/lib/` private on Apache hosts.
 *
 * The archive is written to the project root and is git-ignored.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const stage = path.join(root, "api-package");
const zipPath = path.join(root, "aerocotton-api-upload.zip");
const outDir = path.join(root, "out");

/**
 * Never uploaded, whatever else changes.
 *
 * This applies to the top level of `api/` only: `api/config.php` is the
 * operator's credentials and must be typed on the server. `api/lib/config.php`
 * is *not* the same file — it is the loader, holds no secrets, and has to ship.
 * A shared name-matching rule silently dropped it, which is why `REQUIRED`
 * below exists: completeness is checked, not assumed.
 */
const EXCLUDE_TOP_LEVEL = new Set(["config.php", ".pdf-work"]);

/** Files the endpoint cannot run without. Missing one is a failed pack. */
const REQUIRED = [
  "web.config",
  "api/submit.php",
  "api/health.php",
  "api/lib/config.php",
  "api/lib/mailmode.php",
  "api/lib/mailer.php",
  "api/lib/guard.php",
  "api/lib/request.php",
  "api/lib/forms.php",
  "api/lib/uploads.php",
  "api/config.example.php",
  "api/config.production.example.php",
];

/** Why each file is in the package, for the manifest. */
const REASONS = {
  "web.config": "Stops IIS replacing the endpoint's JSON with its own error page. Back this one up: it also carries the site's MIME types and 404 rule.",
  "api/submit.php": "The endpoint both forms post to.",
  "api/health.php": "Token-protected diagnostics; reports the mail mode and which setting is missing.",
  "api/lib/config.php": "Configuration loader and safe defaults. No credentials in it.",
  "api/lib/mailmode.php": "New: decides who may receive mail, and refuses when the mode is not authorised.",
  "api/lib/mailer.php": "The SMTP client.",
  "api/lib/guard.php": "Origin check, rate limiting, logging, secret masking.",
  "api/lib/request.php": "Reads the submission and reports oversized bodies honestly.",
  "api/lib/forms.php": "Field validation and the two email templates.",
  "api/lib/uploads.php": "Attachment intake, checked by content type.",
  "api/lib/.htaccess": "Keeps the library private on Apache hosts.",
  "api/.htaccess": "Keeps api/lib, api/data, api/logs and the config file private.",
  "api/config.example.php": "Reference: every setting, and the canonical AERO_* names.",
  "api/config.local.example.php": "Local demo template — capture, never deliver.",
  "api/config.production.example.php": "Production template: sample review, then approved live delivery.",
};

function fail(message) {
  console.error(`\n  pack-backend: ${message}\n`);
  process.exit(1);
}

if (!fs.existsSync(path.join(root, "public", "api", "submit.php"))) {
  fail("public/api/submit.php is missing — nothing to pack.");
}

/* ── 1. Copy the endpoint into a clean staging tree ─────────────────────── */

fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });

// Removed up front, not at the end: a pack that fails half way must not leave a
// previous archive sitting there looking current.
fs.rmSync(zipPath, { force: true });

const files = [];

function copy(from, to) {
  const target = path.join(stage, to);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(from, target);
  files.push(to.split(path.sep).join("/"));
}

const apiDir = path.join(root, "public", "api");
for (const entry of fs.readdirSync(apiDir, { withFileTypes: true })) {
  if (EXCLUDE_TOP_LEVEL.has(entry.name)) continue;
  if (entry.isFile()) {
    copy(path.join(apiDir, entry.name), path.join("api", entry.name));
  }
}

const apiLib = path.join(apiDir, "lib");
for (const entry of fs.readdirSync(apiLib, { withFileTypes: true })) {
  if (entry.isDirectory()) continue;
  copy(path.join(apiLib, entry.name), path.join("api", "lib", entry.name));
}

// The IIS rules travel too: without them the endpoint's JSON never reaches the
// form, which is the whole reason the form was failing.
copy(path.join(root, "public", "web.config"), "web.config");

// The operator's credentials file must never be in the package, in any location.
if (files.some((relative) => relative === "api/config.php")) {
  fail("api/config.php would have been packaged — refusing.");
}

const missing = REQUIRED.filter((relative) => !files.includes(relative));
if (missing.length > 0) {
  fail(`the package is incomplete, missing:\n    ${missing.join("\n    ")}`);
}

/* ── 2. Refuse to ship a credential ─────────────────────────────────────── */

const banned = [];
for (const relative of files) {
  const text = fs.readFileSync(path.join(stage, relative), "utf8");
  // A filled-in password: the placeholder in the templates is upper-case and
  // contains no lower-case letters, so anything else is suspicious.
  for (const match of text.matchAll(/'smtp_pass'\s*=>\s*'([^']*)'/g)) {
    const value = match[1];
    if (value !== "" && !/^[A-Z0-9-]+$/.test(value)) {
      banned.push(`${relative}: smtp_pass looks like a real value, not a placeholder`);
    }
  }
  if (/'health_token'\s*=>\s*'[^']*'/.test(text) && /health_token/.test(text)) {
    const token = text.match(/'health_token'\s*=>\s*'([^']*)'/)?.[1] ?? "";
    if (token !== "" && !/^[A-Z0-9-]+$/.test(token) && token !== "local-demo") {
      banned.push(`${relative}: health_token looks like a real value`);
    }
  }
}
if (banned.length > 0) {
  fail(`refusing to pack a credential:\n    ${banned.join("\n    ")}`);
}

/* ── 3. Say what each file does on the host ─────────────────────────────── */

const manifest = files.map((relative) => {
  const alreadyThere = fs.existsSync(path.join(outDir, relative));
  return {
    file: relative,
    destination: `httpdocs/${relative}`,
    action: alreadyThere ? "replace" : "add",
    // Anything that exists on the host is replaced rather than added, so it is
    // backed up first: an upload that goes wrong must be reversible.
    backupFirst: alreadyThere,
    reason: REASONS[relative] ?? "",
  };
});

manifest.sort((a, b) => a.destination.localeCompare(b.destination));

const counts = manifest.reduce(
  (acc, entry) => ({ ...acc, [entry.action]: (acc[entry.action] ?? 0) + 1 }),
  {}
);

fs.writeFileSync(
  path.join(stage, "MANIFEST.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      extractInto: "httpdocs/",
      summary: { files: manifest.length, ...counts },
      exclude: [
        "out/ (the deployed site — never repacked)",
        "api/config.php (credentials, typed on the server)",
        "api/data, api/logs (created by the host on first submission)",
      ],
      files: manifest,
    },
    null,
    2
  ) + "\n"
);

/* ── 4. One archive, contents at its root ───────────────────────────────── */

const BSDTAR = "C:/Windows/System32/tar.exe";
const bsdtar = fs.existsSync(BSDTAR) ? BSDTAR : null;

let zipped = false;
if (bsdtar) {
  const result = spawnSync(bsdtar, ["-a", "-cf", zipPath, "-C", stage, "."], {
    cwd: root,
    encoding: "utf8",
  });
  zipped = result.status === 0 && fs.existsSync(zipPath);
} else {
  const result = spawnSync("zip", ["-r", "-q", zipPath, "."], { cwd: stage, encoding: "utf8" });
  zipped = result.status === 0 && fs.existsSync(zipPath);
}

if (!zipped) {
  console.error("  pack-backend: could not create the archive — the staged tree is still usable.");
} else {
  // Trust the magic bytes, not the exit code.
  const head = fs.readFileSync(zipPath).subarray(0, 2).toString("latin1");
  if (head !== "PK") {
    fs.rmSync(zipPath, { force: true });
    console.error("  pack-backend: the archive is not a zip (tar fallback) — removed it.");
    zipped = false;
  }
}

/* ── 5. Report ──────────────────────────────────────────────────────────── */

console.log(`\n  ${manifest.length} files staged in ${path.relative(root, stage)}/`);
console.log(`  ${counts.add ?? 0} to add · ${counts.replace ?? 0} to replace (back these up first)`);
if (zipped) {
  console.log(`  archive: ${path.basename(zipPath)} (${(fs.statSync(zipPath).size / 1024).toFixed(0)} KB)`);
}
console.log("\n  Extract the archive's contents into httpdocs/ — not into a new folder.\n");
for (const entry of manifest) {
  console.log(`  ${entry.action === "replace" ? "REPLACE" : "   ADD "}  ${entry.destination}`);
}
if (manifest.some((entry) => entry.action === "replace")) {
  console.log("\n  Back up every REPLACE line before uploading. See DEPLOYMENT_MANIFEST.md.\n");
}
