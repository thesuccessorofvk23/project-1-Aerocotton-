# Aerocotton — Storage Size Audit (refreshed)

**Date:** 2026-10-07 · **Measured on:** `E:\Aerocotton` (branch `main`, `6468e63`) · **Read-only: no site state altered**

**Total on disk ≈ 1.29 GB (~1,322 MB)** for a static showcase site whose real content is
`src/` (0.5 MB) + `public/` (57 MB). The hosted site a visitor downloads is only the
`out/` export (~65 MB).

---

## 1. Where the 1.29 GB actually is (measured today)

| # | Path | Size | % | What it is | Needed for the site? |
|---|------|------|---|-----------|----------------------|
| 1 | `node_modules/` | **424 MB** | 32% | npm deps: `next` 193 MB, SWC binaries 102 MB, `sharp` 28 MB, `typescript` 23 MB, `three` 23 MB + ~200 smaller pkgs | No — `npm ci` recreates it |
| 2 | `.pdf-work/` | **286 MB** | 22% | Agent scratch: `tools/` 206 MB (ffmpeg.exe 79 MB, full PHP runtime 92 MB + php.zip 34 MB), `norm/` 76 MB (re-encoded image batches), probe scripts | No — git-ignored scratch |
| 3 | `.git/` | **184 MB** | 14% | History pack ≈ 180 MB. Top blobs: `hero-cotton-intro.mp4` **59.1 + 34.0 + 14.2 MB** (3 generations), `video_watermark_removed.mp4` 24.7 MB, stale root-export blobs | Version control only — never served |
| 4 | `.next/` | **113 MB** | 9% | Build cache (turbopack + server) | No — `npm run build` regenerates |
| 5 | `.kilo/` | **96 MB** | 7% | Another agent's **git worktree** (`wealthy-talos`) — full duplicate of the repo incl. a 24.7 MB video and a 39 MB `public/` | No |
| 6 | `out/` | **65 MB** | 5% | Static export — **this is what CI uploads to Pages** | Regenerable; the *deployed site itself* ≈ this |
| 7 | `public/` | **57 MB** | 4% | **Real site assets**: images 24 MB (products 18, editorial 4.8), hero videos 22 MB, 3D models 7.3 MB, `loader/` 4.1 MB, brand 0.5 MB | **Yes** |
| 8 | Stale root export | **56 MB** | 4% | **An entire previous deployment committed at the repo root** (141+ tracked files: `hero/ videos/ loader/ images/ products/ _next/ 404/ _not-found/ about/ care-guide/ contact/ customer-care/ global-presence/ manufacturing/ sustainability/ index.html index.txt 404.html`). The Pages workflow uploads **only `out/`** — none of this is ever served | No |
| 9 | `videos/` | **12 MB** | 1% | HyperFrames scratch project `aero-cotton-loader` — **19 files are tracked in git** (was created before `.gitignore` covered it) | No — scratch; the real loader is a React component |
| 10 | `src/` + configs + docs | ~1 MB | — | Actual source, workflow, README | **Yes** |

**≈ 76% of the disk (~1,000 MB) is regenerable or scratch — none of it is the website.**

### Why a "few sections + a video" crossed 1 GB — four root causes

1. **Build caches kept beside the source** — `node_modules` + `.next` + `out` = 602 MB, reproducible from `package.json` in ~1 min.
2. **Heavy toolchains downloaded into scratch** — 285 MB of ffmpeg/PHP/image batches under `.pdf-work/`.
3. **Git history holds every generation of every big file** — the intro video was committed at 59 MB, then 34 MB, then 15 MB; all three blobs live forever in `.git`, plus the 24.7 MB watermark-removed copy and the 56 MB root export → 184 MB.
4. **Two agent workspaces duplicated the repo** — `.kilo/` worktree (96 MB) and a tracked `videos/` scratch project (12 MB).

---

## 2. Removable elements — every item, with size reclaimed and site impact

### Tier A — delete from disk, zero risk (all git-ignored or regenerable; nothing committed)

| Action | Reclaim | Restore later with |
|--------|---------|--------------------|
| `.pdf-work/tools` + `.pdf-work/norm` | **282 MB** | re-download if a future pipeline needs them |
| `.kilo/` (other agent's worktree — confirm that work is done first) | **96 MB** | `git worktree add …` |
| `.next/` | **113 MB** | `npm run build` |
| `out/` | **65 MB** | `npm run build` (run before next local serve/deploy) |
| `node_modules/` *(optional)* | **424 MB** | `npm ci` |

**Tier A total: 557 MB reclaimed (1,322 → ~765 MB), or 981 MB if `node_modules` also goes (→ ~341 MB).**
Site impact: **none** — none of these paths is deployed or referenced by source.

### Tier B — tracked dead weight (one commit required)

| Action | Reclaim | Evidence it is safe |
|--------|---------|---------------------|
| `git rm` the **stale root export**: `hero/ videos/ loader/ images/ products/ _next/ 404/ _not-found/ about/ care-guide/ contact/ customer-care/ global-presence/ manufacturing/ sustainability/ index.html index.txt 404.html` at repo root | **56 MB** | Pages workflow uploads **only `out/`**; nothing in `src/`/`scripts/` references root paths; production is untouched |
| `git rm` **`videos/`** (tracked HyperFrames scratch project) | **12 MB** | Scratch only; the site's loader is `src/components/home/CinematicLoadingScreen.tsx` |
| `git rm` **`public/hero/Man_operating_loom_in_factory_20260912095840.mp4`** (3.9 MB) | **3.9 MB** | Zero references in `src/`, `scripts/`, or built HTML |
| `git rm` **`public/hero/hero-loom-gwr.mp4`** (3.2 MB) | **3.2 MB** | Only referenced by **old** compiled chunks (`_next/static/chunks/*` from a previous build); current `src/` uses only `hero-cotton-intro.mp4` |
| `git rm` **`public/loader/`** (4.1 MB — old HTML loader prototype incl. `Loom_weaving_fabric…mp4`) | **4.1 MB** | `src/` never references `/loader/`; the live intro is the React cinematic intro |

**Tier B total: ~79 MB reclaimed** (also shrinks every future clone and the Pages artifact's inputs).
Site impact: **none** — verified by reference search; rebuild + smoke-test after the commit anyway.

### Tier C — compress the real site assets (shrinks the hosted payload)

| Asset | Now | Fix | Expected |
|-------|-----|-----|----------|
| `public/hero/hero-cotton-intro.mp4` (loads on every homepage visit) | **15 MB** | re-encode H.264 CRF 27–29, 1080p, `movflags +faststart` | **3–5 MB** |
| `public/images/products/` (18 MB) | JPEG q≈90+ | re-encode q≈80; `images.unoptimized:true` means no auto-optimization | **8–11 MB** |
| `public/images/editorial/` (4.8 MB) | same pass | | **~3 MB** |
| `public/models/*.glb` (7.3 MB; `block-printed-runner.glb` 3.8 MB, `autumn-print-cushion.glb` 2.5 MB) | uncompressed | `gltfpack -cc` (meshopt/Draco); convert the 1 MB OBJ→GLB | **2–4 MB** |

**Tier C total: `public/` 57 → ~25–30 MB; hosted export `out/` 65 → ~35–40 MB.**
Site impact: **visual only, negligible at these settings** — verify each product thumbnail and the intro playback after re-encoding; originals can be kept in `.pdf-work/` if you want a rollback.

### Tier C′ — trim `node_modules` permanently (dev-only concern)

`next` (193 MB incl. SWC 102 MB) and `three` (23 MB) are required. Removing dev-only extras
(typescript is required for the build too) saves little. The real lever is simply **deleting
`node_modules` when not actively developing** (Tier A optional line) — 424 MB back, restored by
one `npm ci`.

### Tier D — reclaim `.git` (184 MB → ~25 MB) — destructive, needs explicit approval

History rewrite (`git filter-repo`) to drop: the two obsolete `hero-cotton-intro.mp4`
generations (59.1 + 34.0 MB), `video_watermark_removed.mp4` (24.7 MB), and all stale
root-export blobs (~56 MB across history). Then a **force-push**. GitHub Pages is unaffected
(it serves the built artifact, not history), but this is irreversible for collaborators and
clashes with the `.kilo/` worktree while it exists. Listed, **not performed**.

---

## 3. Projected sizes

| Scenario | Removed | Resulting size | Meets 400/300 MB? |
|----------|---------|----------------|--------------------|
| **Today** | — | **~1,322 MB** | — |
| Tier A (keep `node_modules`) | 557 MB | **~765 MB** | ✗ |
| Tier A + B | ~636 MB | **~686 MB** | ✗ |
| Tier A + B + C (compress assets) | ~665 MB | **~657 MB** | ✗ |
| **Tier A + B + C, with `node_modules` deleted when idle** | ~1,089 MB | **~233 MB working / ~250 MB with nm** | **✓ under 300** |
| Tier A + B + C + D (history rewrite, nm kept) | ~1,277 MB | **~495 MB** | ✗ |
| **Tier A + B + C + D + `node_modules` idle-deleted** | | **~90–105 MB** | **✓✓** |

**Bottom line for your 400/300 MB target:** deleting caches/scratch (Tier A) plus the two
commit-level cleanups (Tier B) and asset compression (Tier C) gets the *website itself* to
~250 MB of tracked content; to be **under 300 MB at all times** either (a) remove
`node_modules` between work sessions (`npm ci` brings it back in ~1 min), or (b) additionally
approve the history rewrite (Tier D), which lands ~495 MB *with* dependencies installed and
~90 MB without.

**Rebuild note:** after removing `.next`/`out`/`node_modules`, `npm ci && npm run build`
regenerates everything — this repo is verified to build clean (214 pages) from source alone.

---

## 4. What was NOT touched by this audit

Per your instruction ("present state should not be altered nor functioning affected"):
**no files were deleted, moved, or modified** — this is a measurement-and-plan report only.
Every proposed action above is reversible except Tier D, which additionally requires your
explicit approval and a force-push.

*Generated by a read-only audit at commit `6468e63`.*
