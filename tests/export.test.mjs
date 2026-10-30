/**
 * The already-deployed export must never change under our feet.
 *
 * `out/` is the site that gets uploaded to httpdocs. Rebuilding it is a
 * deliberate act with its own review, so incidental work is not allowed to
 * touch it — and this test is what makes that a fact rather than an intention.
 * Every file is pinned by SHA-256 in tests/fixtures/protected-export.sha256,
 * plus the file count, so a deleted file is caught as well as an edited one.
 *
 * History, because a baseline is only meaningful if its provenance is:
 *
 *   12 Oct 2026  recorded before any backend change (542 files).
 *   19 Oct 2026  re-baselined after a deliberate `npm run build` folded the
 *                repaired homepage form and the current backend into the
 *                export (545 files: 8 build artefacts replaced, 11 added —
 *                web.config, the two new config examples and mailmode.php).
 *                The build was checked before re-pinning: pages and titles
 *                intact, no private config or secret in the tree, and
 *                `out/api/` byte-identical to `public/api/` apart from the
 *                local runtime state the build strips. The old bytes are not
 *                in Git (`/out/` is ignored), so the baseline has to move to
 *                the export that will actually ship.
 *
 *   30 Oct 2026  re-baselined after a deliberate `npm run build`. The only
 *                source change folded in was health.php's config lookup, which
 *                walked three levels up from `api/` instead of two and so
 *                reported "defaults" while a config placed beside `httpdocs`
 *                was loaded. Still 545 files; the hashed asset names moved with
 *                the new build id, and `out/api/` was checked to match
 *                `public/api/` before re-pinning.
 *
 *   30 Oct 2026  re-baselined again after a verification `npm run build`. This
 *                time nothing in the source changed, so the pin had to move
 *                for the build id alone: that build was repeated into a
 *                throwaway directory (NEXT_DIST_DIR=out-verify), and the two
 *                exports compared file by file with the id normalised — 494 of
 *                them identical, the only differences being the three
 *                build-id manifests, the flattened segment payload paths and
 *                sitemap.xml's build timestamp. Still 545 files.
 *
 * Any further change to `out/` still has to be a deliberate `npm run build`
 * with this fixture regenerated as part of it — reviewed, not a side effect.
 */
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE = path.join(ROOT, "tests", "fixtures", "protected-export.sha256");
const EXPORT = path.join(ROOT, "out");

const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

/** Parsed fixture: [{ expected, relative }]. */
function fixture() {
  return fs
    .readFileSync(FIXTURE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [expected, name] = line.split(/\s+\*?/);
      return { expected, relative: name };
    });
}

test("the deployed export is unchanged", async (t) => {
  await t.test("every pinned file is present and byte-identical", () => {
    const entries = fixture();
    assert.ok(entries.length > 500, `expected a full export in the fixture, found ${entries.length} entries`);

    const missing = [];
    const changed = [];

    for (const { expected, relative } of entries) {
      const file = path.join(ROOT, relative);
      if (!fs.existsSync(file)) {
        missing.push(relative);
        continue;
      }
      if (sha256(file) !== expected) changed.push(relative);
    }

    assert.deepEqual(missing, [], "files from the deployed export have gone missing");
    assert.deepEqual(changed, [], "files from the deployed export have been modified");
  });

  await t.test("the export has not grown: no new files were added to it", () => {
    const pinned = new Set(fixture().map((entry) => entry.relative));

    const present = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else present.push(path.relative(ROOT, full).split(path.sep).join("/"));
      }
    };
    walk(EXPORT);

    const added = present.filter((file) => !pinned.has(file));
    assert.deepEqual(added, [], "new files have appeared inside the deployed export");
    assert.equal(present.length, pinned.size, "the export's file count has changed");
  });

  await t.test("the pages the change was meant to leave alone are intact", () => {
    const index = fs.readFileSync(path.join(EXPORT, "index.html"), "utf8");
    assert.match(index, /<title>/i, "the homepage still has its title");

    const contact = fs.readFileSync(path.join(EXPORT, "contact", "index.html"), "utf8");
    for (const field of ["name", "company", "email", "country", "interest", "message"]) {
      assert.ok(contact.includes(`name="${field}"`), `the contact form should still render the ${field} field`);
    }

    // The backend travels with the export, so the deployed tree carries it too —
    // and it must be the backend in this working tree, not an older copy that
    // happened to be there when the export was built.
    for (const relative of [
      ["out/api/submit.php", "public/api/submit.php"],
      ["out/api/lib/mailmode.php", "public/api/lib/mailmode.php"],
      ["out/api/lib/config.php", "public/api/lib/config.php"],
      ["out/web.config", "public/web.config"],
    ]) {
      assert.ok(fs.existsSync(path.join(ROOT, relative[0])), `${relative[0]} must be in the export`);
      assert.equal(
        sha256(path.join(ROOT, relative[0])),
        sha256(path.join(ROOT, relative[1])),
        `${relative[0]} must match ${relative[1]}: rebuild the export rather than ship a stale backend`
      );
    }
  });
});
