# Deployment rehearsal report — `aerocotton-api-upload.zip`

> **SIMULATED ONLY — this is not a production deployment record.**
> Every check below ran against a fabricated `httpdocs` tree on this machine
> (`E:\deployment-rehearsal\`), built from synthetic stub content. **No
> connection was made to the production server.** No file was uploaded or
> downloaded, no live configuration was read, no DNS record was touched, no
> mailbox was contacted and no email was sent. Nothing on the host changed, and
> nothing here proves that the real deployment will succeed.

|  |  |
|---|---|
| Date | 2026-10-15 |
| Subject | `aerocotton-api-upload.zip` — 16 entries (15 application files + `MANIFEST.json`) |
| Driver | `.pdf-work/deploy-rehearsal.mjs` (git-ignored scratch), reproducible with `node .pdf-work/deploy-rehearsal.mjs` |
| Raw evidence | `E:\deployment-rehearsal\results.json` (all phase results), `baseline-hashes.json` (pre-deploy hashes) |
| Host model | IIS 10 / Plesk on Windows, `.htaccess` inert, PHP handler via FastCGI |
| Repo checks re-run this turn | `npm test` → **33/33 pass, exit 0**; `npm run typecheck` → **exit 0**; `git diff --check` → clean |
| Staged / committed | **nothing** — working tree untouched by this rehearsal |

---

## 1. Rehearsal results

### 1.1 Simulated hosting tree

24 files, all synthetic (stub homepage, stub `404.html`, stub `about/`, two
`_next/static` assets, a stub font, a stub `.mp4`, an `images/logo.svg`):

| Category | Contents |
|---|---|
| Static site | `index.html`, `404.html`, `about/index.html`, `_next/static/chunks/app/page-7f3a2b.js`, `_next/static/css/app-9d1.css`, `fonts/brand.woff2`, `images/logo.svg`, `videos/hero.mp4` |
| Existing backend (all 12 `REPLACE` targets) | `web.config`, `api/.htaccess`, `api/config.example.php`, `api/health.php`, `api/submit.php`, `api/lib/{.htaccess,config.php,forms.php,guard.php,mailer.php,request.php,uploads.php}` |
| Must-be-preserved state | `api/config.php` (fake credentials), `api/data/rate-global.json`, `api/logs/submissions.log` (fake refs), `api/uploads/.keep` |
| Existing `web.config` | Plesk-style: `index.htm` + `index.html` default documents, **FastCGI PHP handler**, **Force HTTPS rewrite**, and the two live defects — `existingResponse="Replace"` and `responseMode="ExecuteURL"` |

The stub files were deliberately named and annotated `REHEARSAL`/`SYNTHETIC`; no
production secret, customer row or private credential was copied in.

### 1.2 Phase results (re-run from a clean tree, exit 0)

| Phase | Check | Result |
|---|---|---|
| P0 | Fabricated tree built, baseline SHA-256 recorded | **PASS** — 24 files |
| P1 | Backup paths in `DEPLOYMENT_MANIFEST.md` vs `PRODUCTION_HANDOVER.md` | **PASS** — both list the same six paths; they cover 12/12 `REPLACE` targets |
| P1b | Backup correctness (existence, byte-equality, coverage, `web.config` restore) | **PASS** — 12 files, 0 mismatches, restore byte-for-byte exact |
| P2 | Staging vs package: 15 files, none missing, none extra | **PASS** — 0 differ from `public/` source |
| P2 | `web.config` merge, 5 operations, XML well-formed | **PASS** |
| P2 | Apply: 1 merged + 11 replaced + 3 added | **PASS** |
| P3 | Post-deploy integrity (drift, mismatches, preservation, secrets) | **PASS** — no drift, no mismatch, no credential |
| P4 | Failure detection + rollback | **PASS** — corruption detected; all 12 restored byte-identical |
| P5 | 13 static security/config assertions on the effective (comment-stripped) merged config | **PASS** — 13/13 |

### 1.3 `web.config` merge — what the merge did

The merge never overwrote blind. Five operations, all applied to the host's
existing file:

1. `existingResponse="Replace"` → **`"PassThrough"`** (the app's JSON now survives an error status).
2. `responseMode="ExecuteURL"` → **`"File"`** (404 keeps its 404 status).
3. `hiddenSegments` **added** `lib`, `data`, `logs`, `config.php`, `config.example.php`, `config.local.example.php`, `config.production.example.php`, `aero-config.php`; the host's existing `bin` and `App_Data` were **kept**.
4. `.log` denial **inserted into the host's existing `<security>` block**.
5. MIME maps added for `.woff2 .webp .json .mp4 .glb .obj`; the host's existing `.svg` map **kept**.

Preserved byte-identical from the host's copy: **`<handlers>` (the FastCGI PHP
mapping), `<rewrite>` (Force HTTPS)** and `<defaultDocument>` (kept the host's
`index.htm` + `index.html` rather than the package's `index.html`-only list, per
`DEPLOYMENT_MANIFEST.md` §3). Result was parsed with a real XML parser and is
well-formed.

---

## 2. Backup and rollback verification

**Backup.** The six documented paths expand to 12 files. All six existed in the
simulated host, all 12 were copied, and every copy was byte-identical to its
original. The documented list covers **all 12 `REPLACE` targets** — nothing that
gets overwritten is left unprotected, and the rehearsal found no
documented-vs-manifest disagreement (the mismatch that started the previous
audit is closed).

**`web.config` restore.** Restoring the backed-up copy reproduced the original
byte-for-byte (baseline hash `4daa9d68…` → restored `4daa9d68…`). In a real run
this is point 1 of the merge procedure in `DEPLOYMENT_MANIFEST.md` §3, which is
also the rollback artefact.

**Failure simulation.** A truncated `api/submit.php` (partial upload) was
detected by hash verification before anything else ran — the failure is caught,
not silent.

**Rollback.** After the simulated failure, all 12 `REPLACE` targets were restored
**byte-identical to baseline** (0 not restored), and the endpoint returns to its
previous behaviour with no other state involved.

**One documentation gap, found by this rehearsal, and now fixed.** The
documented rollback restores the six paths but said nothing about the three `ADD`
files (`api/config.local.example.php`, `api/config.production.example.php`,
`api/lib/mailmode.php`), which therefore **remain in place** after a rollback.
Harmless — `mailmode.php` is referenced only by the *new* `submit.php`, and the
two config files are never loaded — but the operator should know the tree is not
byte-identical to its pre-deployment state.

Rather than leave this to the operator, one paragraph was added to the rollback
section of [DEPLOYMENT_MANIFEST.md](DEPLOYMENT_MANIFEST.md) §2 stating that the
three files are not in the backup, that they are left behind, and that they are
inert once the restored `submit.php` is in place (leave or delete; either is
correct). The file went from 185 to 193 lines and its four table separators are
intact. **The rehearsal was re-run after that edit** (exit 0, P1 still passes),
so the docs it parses are the edited ones.

---

## 3. Hash-comparison results

Full hashes are in `E:\deployment-rehearsal\results.json` and
`baseline-hashes.json`; truncated to 16 hex characters here.

### 3.1 The 12 `REPLACE` targets

| Path | baseline (fabricated host) | after deploy | equals `public/` copy? |
|---|---|---|---|
| `web.config` | `4daa9d68a1f3ce40` | `0be0568208380329` | **no — by design** (merged, §1.3) |
| `api/.htaccess` | `d3b53478470966c6` | `8b9b38fede2d0ab7` | yes |
| `api/config.example.php` | `43970c29b4b582b1` | `b804153105fac369` | yes |
| `api/health.php` | `1ae22e11ff72f2ba` | `a3aba2cc7c83fa61` | yes |
| `api/lib/.htaccess` | `b06923a4586ed49e` | `0c28898104c41681` | yes |
| `api/lib/config.php` | `a5ea49540b8447d4` | `d5e01b131151cfd2` | yes |
| `api/lib/forms.php` | `b623456d3db7cb22` | `ceecf0b0190612c8` | yes |
| `api/lib/guard.php` | `f8255b7c4e3c9f63` | `90ce1e2a15eacc57` | yes |
| `api/lib/mailer.php` | `d2822d04717e97c1` | `b73ff03acfd1d66e` | yes |
| `api/lib/request.php` | `d2317957107719a1` | `419ee2d91e3239e8` | yes |
| `api/lib/uploads.php` | `92133c3d495e75c8` | `91393c10d9e5d21c` | yes |
| `api/submit.php` | `56d1dd488ac06402` | `71e44eef1107639f` | yes |

Every replacement is byte-identical to its shipped source. `web.config` is the
only one that differs from the package's copy — intentionally, because it is a
merge into the host's file (the package's bytes are a *subset* of it, plus the
host's sections). **A real deployment must not expect `cmp` to pass on
`web.config`.**

### 3.2 The 3 `ADD` files

| Path | baseline | after deploy | note |
|---|---|---|---|
| `api/config.local.example.php` | absent | `aaeff1f727f26224` | new file, matches package |
| `api/config.production.example.php` | absent | `4d41d27a98159d49` | new file, matches package |
| `api/lib/mailmode.php` | absent | `6f2852267135635e` | new file, matches package |

### 3.3 Files that must not change at all

All 12 checked files are **byte-identical to baseline — 0 drift**:

`index.html`, `404.html`, `about/index.html`,
`_next/static/chunks/app/page-7f3a2b.js`, `_next/static/css/app-9d1.css`,
`fonts/brand.woff2`, `images/logo.svg`, `videos/hero.mp4`,
`api/config.php`, `api/data/rate-global.json`, `api/logs/submissions.log`,
`api/uploads/.keep`.

No baseline file is missing from the tree after deployment (excluding the
package paths themselves).

---

## 4. Static-site preservation results

The deployment touches the **backend only**. Verified after the rehearsal
deployment:

| Guarantee | Result |
|---|---|
| Live homepage and pages | unchanged (`index.html`, `404.html`, `about/index.html`) |
| Built JS/CSS assets | unchanged |
| Fonts, images, video | unchanged |
| `api/config.php` (operator's live credentials) | **untouched** — not in the package, not overwritten |
| Runtime rate-limit state (`api/data/rate-global.json`) | untouched |
| Submission log (`api/logs/submissions.log`) | untouched |
| Attachments directory marker (`api/uploads/.keep`) | untouched |
| Files added outside the package | **none** (0 extras in staging; 0 unexpected files in the tree) |

This matches the operator instruction in `PRODUCTION_HANDOVER.md` §5: *"Do not
re-upload `out/`. It is the site that is already live."*

---

## 5. IIS checks that remain unverified

The merged configuration is valid XML and asserts the right attributes, but **no
real IIS was available**. The following are *documented semantics only* and are
confirmed by nothing in this rehearsal:

1. That `existingResponse="PassThrough"` actually stops IIS discarding the
   endpoint's JSON on a 422/500 — the whole point of the fix. Real check:
   `PRODUCTION_HANDOVER.md` §6.
2. That the 404 rule returns the branded page **with a 404 status** (not 200).
3. That `<hiddenSegments>` really denies `/api/lib/`, `/api/data/`, `/api/logs/`,
   `/api/config*.php`, `/api/aero-config.php` — including nested/case-varied paths.
4. That `.log` is refused by `fileExtensions`, and that no visitor can read
   `submissions.log` (which holds enquirer names, emails, phones, messages).
5. That the MIME maps (`woff2 webp json mp4 glb obj`) are accepted without
   duplicate-map errors on the host's IIS.
6. That the preserved `<handlers>` mapping still runs PHP after the upload, and
   what PHP version/extensions the host actually has.
7. Whether the **live** `web.config` carries sections the package's file does not
   (`<handlers>`, `<rewrite>`, Plesk additions). The live file cannot be read
   from outside — production answers every missing path with `404.html` — so this
   is only knowable on the server. This is why the merge, not a replacement, is
   the procedure.
8. That the Force-HTTPS rewrite and default-document order survive the merge on
   the real host.
9. That outbound SMTP from the host is permitted at all (some shared hosts block
   it). Probe: `api/health.php?token=…&probe=1`.

Items 1–8 are structural to the hosting change and must be checked on the host;
they cannot be settled locally.

---

## 6. Git changes prepared

**Nothing was staged and nothing was committed.** `git diff --check` is clean
(no whitespace/conflict errors) and the working tree was not modified by this
rehearsal. What exists is a *narrow staging plan* for the operator to review.

### 6.1 Load-bearing files that are still untracked

These are the S8 finding from the diagnostic report: a fresh clone silently
loses the endpoint's loader, its delivery gate, the IIS fix and the Apache twin.
**They must be added, or the package remains the only complete copy.**

| File | Why it matters |
|---|---|
| `public/web.config` | the IIS fix itself |
| `public/.htaccess` | the Apache twin (site root) |
| `public/api/lib/config.php` | the endpoint's configuration loader |
| `public/api/lib/mailmode.php` | the delivery gate — *required* by the new `submit.php` |

Also new and worth tracking: `public/api/config.local.example.php`,
`public/api/config.production.example.php`, `public/.htaccess`.

### 6.2 Narrow staging plan (three commits, in order)

1. **Backend + IIS fix (the deployment payload).**
   `public/web.config`, `public/.htaccess`,
   `public/api/submit.php`, `public/api/health.php`, `public/api/.htaccess`,
   `public/api/config.example.php`, `public/api/lib/{config,mailmode,mailer,request}.php`,
   `public/api/config.local.example.php`, `public/api/config.production.example.php`.
2. **Tooling and tests.** `scripts/*.mjs` (pack-backend, pack-upload, serve-export,
   normalize-segment-payloads, clean-api-runtime-state, dev-mail-stack,
   make-portable-export, open-site, send-sample-enquiry), `tests/`, `package.json`,
   `package-lock.json`, `next.config.ts`, `.gitignore`, `View Site.cmd`.
3. **Operator documentation.** [DEPLOY.md](DEPLOY.md),
   [DEPLOYMENT_MANIFEST.md](DEPLOYMENT_MANIFEST.md),
   [PRODUCTION_HANDOVER.md](PRODUCTION_HANDOVER.md),
   [SMTP_CONFIGURATION_CHECKLIST.md](SMTP_CONFIGURATION_CHECKLIST.md),
   [SMTP_AUDIT_REPORT.md](SMTP_AUDIT_REPORT.md), [TEST_REPORT.md](TEST_REPORT.md),
   [AEROCOTTON_CONTACT_FORM_DIAGNOSTIC_REPORT.md](AEROCOTTON_CONTACT_FORM_DIAGNOSTIC_REPORT.md),
   this report, [README.md](README.md).

**Deliberately excluded from the plan** — pre-existing changes not made by this
work and not part of the deployment: the deletions of `.agents/skills/aero/`,
`.agents/skills/designer/` and `src/lib/rfq/{actions,rate-limit,send}.ts`, plus
the unrelated report files. They are left exactly as found.

### 6.3 Secret scan of everything the plan would stage

4 matches, **all inspected and all benign**:

| Where | Match | Verdict |
|---|---|---|
| `DEPLOY.md:155-156` | `'smtp_user' => 'enquiries@aerocotton.in'`, `'smtp_pass' => 'the mailbox password'` | a documented placeholder — the word "password" as text |
| `PRODUCTION_HANDOVER.md:145-146` | `'<the sending mailbox>'`, `'<its password or app password>'` | angle-bracket placeholders |
| `SMTP_AUDIT_REPORT.md:407` | the sentence quoting the template placeholder | prose |
| `public/api/config.local.example.php:62` | `'health_token' => 'local-demo'` | the local-demo token, whitelisted by name in the packer; loopback capture only |

The real credential keys ship blank — `smtp_host`, `smtp_user`, `smtp_pass`,
`health_token` are all `''` in `public/api/lib/config.php` and in both example
templates (verified by direct read, not by the scan alone). `.gitignore` covers
`/out/`, `/aero-config.php`, `/api-package/` and `/.pdf-work/`.

---

## 7. Remaining requirements for secure production deployment

**Blocking, in order.**

1. **Hosting access is still missing.** The single blocker: a credential for the
   BigRock control panel / file manager. Nothing in this rehearsal substitutes
   for it.
2. **A secure transfer method must be identified before any upload.** `DEPLOY.md`
   is explicit that **plain FTP sends the password in clear text**; if BigRock
   offers **SFTP on port 22**, that is the method to use. If no encrypted
   transfer path exists, **that is a blocker to report**, not something to work
   around with plain FTP.
3. **Mailbox answers, before anything is sent** — [SMTP_CONFIGURATION_CHECKLIST.md](SMTP_CONFIGURATION_CHECKLIST.md) §2,
   all eleven questions, most importantly: which provider actually hosts the
   mailbox (the domain's MX points at **Google Workspace**, not BigRock), the
   exact submission host, the port/encryption pair, whether SMTP AUTH needs an
   **app password**, and confirmation that any password previously shared in chat
   has been revoked or rotated.
4. **A new `health_token`** (32+ random characters) set on the server — until
   then `/api/health.php` answers 404 to everyone, which is the page failing
   closed.
5. **Credentials placed outside the web root** (`aero-config.php` beside
   `httpdocs/`, recommended) — never uploaded in the archive.
6. **Client approval before the sample, and a second approval before live
   delivery** (`mail_mode`/`mail_sample_approved`, then
   `mail_production_approved`). Never inferred.
7. **DNS (SPF/DKIM/DMARC) may need the domain owner's authorisation.** DMARC is
   currently missing and MX is Google, so mail sent through a different provider
   will `softfail` unless SPF is updated. This needs a third party's sign-off and
   is not part of this task.
8. **After upload, run [PRODUCTION_HANDOVER.md](PRODUCTION_HANDOVER.md) §6** in full, including the
   `&probe=1` mailbox probe (connects, negotiates TLS, authenticates — **sends
   nothing**) and the checks in §5 above.

**Explicitly not done and not claimed.**

- No email was sent, and no mailbox was contacted. The endpoint's own limit is
  5 per 600 s and 60 per day; the provider's sending limit must be at least
  that, or enquiries will bounce.
- **SMTP configuration and the sample-email delivery test remain separate tasks**
  requiring verified mailbox settings and explicit authorization. They cannot be
  satisfied by this rehearsal, and no part of it should be read as evidence that
  email works.
- The simulated deployment is not a production deployment, and this report does
  not claim otherwise.

Once the transfer credential exists, the operator's minimal safe sequence is:
**back up the six documented paths → merge `web.config` (preserving
`<handlers>`/`<rewrite>`) → extract the archive into `httpdocs/` → place the
credentials outside the web root → set `health_token` → run the §6 checklist.**
