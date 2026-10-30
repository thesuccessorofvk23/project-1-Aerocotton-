# Aerocotton — Tier C + Tier D Report

**Date:** 2026-10-08 · **Branch:** `main` · **Remote:** `https://github.com/thesuccessorofvk23/project-1-Aerocotton-.git`
**Scope:** Tier C (real asset optimisation) + Tier D (Git history rewrite). Tier A and Tier B were left untouched.

---

## 1. Tier C — asset optimisation (done, verified live)

| Asset | Before | After | Saved | How |
|---|---:|---:|---:|---|
| `public/hero/hero-cotton-intro.mp4` | 14,875,294 B (14.19 MiB) | 4,844,134 B (4.62 MiB) | 10.03 MB (−67%) | H.264 `-preset veryslow -tune film -crf 33`, audio kept, 1280×720 / 44.50 s / 30 fps unchanged. VMAF 78, SSIM 0.9696 |
| 37 live product stills | 5,203,812 B (4.96 MiB, JPEG) | 3,387,866 B (3.23 MiB, WebP q82) | 1.82 MB (−35%) | WebP q82 effort 6, **identical pixel dimensions verified**, 0 stale `.jpg` refs left |
| `public/models/block-printed-runner.glb` | 3,933,900 B | 1,028,452 B | 2.91 MB (−74%) | dedup + prune + textures 2048→1024, geometry/materials untouched |
| `public/models/autumn-print-cushion.glb` | 2,594,548 B | 1,607,228 B | 0.99 MB (−38%) | same pass |
| `public/models/cotton-tote-bag.obj` | 1,018,604 B | unchanged | 0 | deliberately left: OBJ needs the house material pipeline |

Tier C total: `public/` 57 MB → 31 MB · hosted export 65 MB → 39 MB.

**Verification performed**

- `npx tsc --noEmit` exit 0 · `npm run build` exit 0 (exit status preserved through the log filter)
- Crawl of every local `src`/`href` in all 54 exported HTML pages → **0 unresolved references**
- Hero video played in-browser (1280×720, loop, muted, no error); all three 3D viewers mounted a WebGL canvas, model fetched 200, canvas actually drew
- Re-ran the repro scripts end-to-end; `node --check` passes on all three edited scripts
- **Deployed and independently re-verified live:** Actions run for `e02f0f9` = `success`; `https://aerocotton.runs-on.dev` serves the 4,844,134-byte hero video and `Content-Type: image/webp` product stills

**Reporting nuance (undeclared by the original ask):** the "18 MB of product images" in the audit counted *all* of `public/images/products/`, but only ~5 MB is referenced by the app. The other ~14 MB (`autumn-cushion-2026`, `blankets`, `place-mats-runners`, `textiles-product`, `cushions-chair-pads`) is documented in `src/content/catalogue.ts` as **retired at the client's request** and is unreferenced, so it was left untouched per "do not optimise assets that are not part of the live website".

---

## 2. Tier D — history rewrite (done, pushed after approval — see §4)

### Pre-flight (all confirmed)

| Check | Result |
|---|---|
| Current branch | `main` |
| Old HEAD SHA | `e02f0f9c1bec58393c6d75528b1270412eb9379a` |
| Remote | `https://github.com/thesuccessorofvk23/project-1-Aerocotton-.git` |
| Working tree clean | ✅ only `SIZE_AUDIT.md` untracked (by design) |
| Remote actually at old HEAD | ✅ `git ls-remote` → `e02f0f9… refs/heads/main` |
| Safety reference created **before** rewriting | ✅ full bundle `E:\_ac_tierd_backup\repo-before-tierd.bundle` (201 MB, `git bundle verify` = complete history), plus a bare clone `E:\_ac_tierd_backup\verify.git` proven to contain `e02f0f9` |
| Nothing needed at HEAD is in the strip list | ✅ the 975 target blobs were intersected against all 337 blobs in HEAD's tree — **0 collisions** |
| Rewrite tool | `git filter-repo` v31ebad4c8fb3 (`--strip-blobs-with-ids`, **exact object IDs only — no wildcards**), run with a portable Python 3.13 in `E:\_ac_tools` |

### Result

| Metric | Before | After |
|---|---:|---:|
| Old HEAD SHA | `e02f0f9c1bec58393c6d75528b1270412eb9379a` | — |
| New HEAD SHA | — | `4dddbe6db2e05438c0024d1f938221adae724250` |
| HEAD **tree** SHA | `8ec57400ef14afed3a24b9633b9f1ea8dd1012ff` | `8ec57400ef14afed3a24b9633b9f1ea8dd1012ff` (**bit-identical**) |
| Files tracked at HEAD | 338 | 338 |
| Commits on `main` | 92 | 91 (see note) |
| `.git` size | 194 MB | **35 MB** |
| Objects in pack | 2,638 + 369 loose | 1,280, 0 loose |
| Pack size | 178.78 MiB | 34.25 MiB |

### What was removed from all history — 975 blobs, 160.0 MiB raw

| Area | Blobs | Raw |
|---|---:|---:|
| `public/hero/hero-cotton-intro.mp4` — the 3 superseded generations (61.9 MB, 35.7 MB, 14.9 MB) | 3 | 112.5 MB |
| `hero/` at repo root — `video_watermark_removed.mp4` (24.7 MB), `Man_operating_loom_…mp4` (3.8 MB), `hero-loom-gwr.mp4` (3.1 MB) | 3 | 33.2 MB |
| `videos/aero-cotton-loader/` scratch project (19 tracked files) | 14 | 7.9 MB |
| `public/models/` — the 2 superseded GLB generations replaced in Tier C | 2 | 6.5 MB |
| `loader/` at repo root (old HTML loader prototype) | 3 | 4.1 MB |
| `_next/` at repo root (build chunks from the old export) | 39 | 1.7 MB |
| Stale root export (`404`, `_not-found`, `about`, `care-guide`, `contact`, `customer-care`, `global-presence`, `images`, `index.html`, `index.txt`, `manufacturing`, `products`, `sustainability`) | 911 | 1.9 MB |

`.pdf-work/tierd/strip-blobs.txt` holds the exact 975 object IDs that were stripped, for auditability.

### Verification after the rewrite

- **Working tree intact:** `git ls-tree -r HEAD` diffed against the pre-rewrite listing → **identical, all 338 entries**, and HEAD's tree object hash is unchanged
- **No collateral deletion:** every candidate blob was checked against HEAD's tree first; **0 collisions**, so nothing live was touched. The 5 key blobs (3 hero films, 2 old GLBs) plus the watermark film are `purged` from the object database
- **Source intact:** `src/` = 533 KB across 64 tracked files; `HeroVideo.tsx`, `collections.ts`, `catalogue.ts` and `deploy-pages.yml` all present and unmodified
- **Optimised assets still present:** on disk *and* in the fresh export — hero 4,844,134 B, GLBs 1,028,452 / 1,607,228 B, OBJ 1,018,604 B, 37 `.webp` files
- **Production build succeeds:** `rm -rf out && npm run build` → exit 0; re-crawl of the new export → 54 pages, 125 refs, **0 unresolved**
- **Historical commits still traversable:** `HEAD`, `HEAD~1`, `HEAD~5`, `HEAD~20`, `HEAD~50` all resolve with `src/` present
- **History is genuinely clean:** 625 blobs remain, and the largest non-`public/` blob in the entire rewritten history is `Untitled.blend` at 0.38 MB. The 34.25 MiB pack is approximately just the live site content (31 MB `public/` + 0.5 MB `src/` + history overhead)
- **Garbage collection:** `git reflog expire --expire=now --all` + `git gc --prune=now` → 0 loose objects, single pack
- **Remote can be force-updated:** `git push --dry-run` → `+ e02f0f9...4dddbe6 HEAD -> main (forced update)`

### Note — one commit was pruned (92 → 91)

`feat: swap hero background film for the new master` disappeared. That commit's *only* change was to replace one generation of the hero film with another; since all generations of that film are now gone from history, the commit's tree became identical to its parent's — a genuine no-op. This is `filter-repo`'s documented `--prune-empty=auto` behaviour. **No source, config, or asset content was lost** (proven by the identical HEAD tree). If you'd rather keep a placeholder commit there, the rewrite can be redone from the bundle with `--prune-empty=never`.

### Rollback

The pre-rewrite repository is fully recoverable — nothing was deleted from the backup:

```
git clone /e/_ac_tierd_backup/repo-before-tierd.bundle restored-aerocotton
```

That bundle verifies as a complete history and contains `e02f0f9c1bec58393c6d75528b1270412eb9379a` exactly as pushed.
The in-repo `backup/pre-tier-d` branch / `pre-tier-d-backup` tag were deliberately removed *after* the rewrite, because `filter-repo` had already re-pointed them at the new history and keeping any ref to the old objects would have pinned the 160 MB back into `.git`.

---

## 3. Size breakdown

| Metric | Before | After | Saved |
|---|---:|---:|---:|
| Total working directory | ~1,322 MB | 624 MB | ~698 MB |
| `.git/` | 194 MB *(184 MB at audit time)* | 35 MB | 159 MB |
| `node_modules/` | 424 MB | 424 MB | 0 MB |
| `.next/` | 113 MB | 71 MB | 42 MB |
| `public/` | 57 MB | 31 MB | 26 MB |
| Real deployed assets (`out/`, the artifact CI uploads) | 65 MB | 39 MB | 26 MB |
| `.pdf-work/` (scratch) | 286 MB | 25 MB | 261 MB |
| `.kilo/` (another agent's worktree) | 96 MB | 0 MB | 96 MB |
| `videos/` (tracked scratch) | 12 MB | 0 MB | 12 MB |

### Status of the 300 MB target

**Met when idle, not met while dependencies are installed.**

- 624 MB now, with `node_modules/` (424 MB) installed
- **200 MB** once `node_modules/` is removed — comfortably under 300 MB, and restorable with a single `npm ci`
- The website itself is 624 MB − 424 MB = **200 MB**, of which 35 MB is history and 39 MB is the deployable export

---

## 4. Push and final verification (executed after approval)

Push method — safety-first, never a blind `--force`:

```
git push --force-with-lease=refs/heads/main:e02f0f9c1bec58393c6d75528b1270412eb9379a \
  origin HEAD:refs/heads/main
+ e02f0f9...4dddbe6 HEAD -> main (forced update)      # exit 0
```

The explicit lease SHA was read from `git ls-remote` beforehand, so the push could only succeed if the remote was still exactly at the state this rewrite was built from.

| Final check | Result |
|---|---|
| Remote `refs/heads/main` | `4dddbe6db2e05438c0024d1f938221adae724250` — **matches local HEAD** |
| Local tracking ref `origin/main` | `4dddbe6db2e05438c0024d1f938221adae724250` |
| Pages workflow for the new SHA | `completed` / **`success`** |
| Homepage | 200, 48,181 bytes (unchanged) |
| `/hero/hero-cotton-intro.mp4` | 200, `Content-Length: 4844134` — exact match |
| `/images/products/apron-design-01.webp` | 200, `Content-Length: 44362` |
| `/images/products/tp-design-01.webp` | 200, `Content-Length: 32790` |
| `/models/block-printed-runner.glb` | 200, `Content-Length: 1028452` — exact match |
| `/products` | 301 → `/products/` 200 — the same pre-existing trailing-slash behaviour as `/about`; not a regression |

### One open caveat — GitHub-side storage reclamation is asynchronous

`GET /repos/…` still reports `"size": 196786` KB (~192 MB). That is **GitHub's own disk accounting for the server-side clone**, and it does not update the moment a force push makes the old objects unreachable. The old commit `e02f0f9` is no longer reachable from any ref on the remote, so those objects are now eligible for GitHub's garbage collection; the figure normally drops on GitHub's own schedule. If it is still ~192 MB after a day or so, GitHub Support can be asked to run a forced GC on the repository — the local repository is already at its true 35 MB.

## 5. Not done, by design

- Tier A / Tier B work was not repeated, undone, or modified.
- The 14 MB of retired deck imagery and `public/models/cotton-tote-bag.obj` were left alone.
- `Untitled.blend` (403 KB) and `build.log` are still tracked at HEAD — they are part of the current committed state, outside Tier C/D's mandate.
