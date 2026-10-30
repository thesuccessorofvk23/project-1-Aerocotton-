# Deployment manifest

Every file to copy, where it goes, and why. Generated from
[api-package/MANIFEST.json](api-package/MANIFEST.json), which
`npm run pack:api` rewrites each time it runs — so this document and the package
cannot drift apart without the numbers disagreeing.

**Package:** `aerocotton-api-upload.zip` (41 KB · 15 files + `MANIFEST.json`)
**Extract into:** `httpdocs/` — the *contents* of the archive, not the folder.
**Generated:** 14 October 2026, by `npm run pack:api`

The archive holds 16 entries: the 15 application files below, plus
`MANIFEST.json` — this document's machine-readable twin, one row per file with
destination, action, and whether it must be backed up first.

> This package contains **no credentials**. `api/config.php` is excluded by
> name, and the packer scans everything it stages and refuses to build if a
> filled-in password appears in any file. Passwords are typed on the server —
> see [PRODUCTION_HANDOVER.md](PRODUCTION_HANDOVER.md) §3.

---

## 1. Files to upload

`REPLACE` means the file already exists on the host and is overwritten.
**Back up every `REPLACE` line first** — all 12 are recoverable in one step from
the backup, and not otherwise.

| # | Destination under `httpdocs/` | Action | Back up | Why |
|---|---|---|---|---|
| 1 | `web.config` | **REPLACE** | **yes** | Stops IIS discarding the endpoint's JSON in favour of its own error page — the difference between the visitor seeing a real reason and the meaningless "not responding from this address". Also carries the site's MIME types, the default document and the 404 rule. Adds the rules that hide `api/lib`, `api/data`, `api/logs` and refuse `.log`. |
| 2 | `api/submit.php` | **REPLACE** | **yes** | The endpoint both forms post to. Adds the mail-mode gate and the honest size-vs-validation error. |
| 3 | `api/health.php` | **REPLACE** | **yes** | Token-gated diagnostics. Now reports the mail mode, the reason delivery is refused, and separates configuration from connectivity, authentication, acceptance and delivery. |
| 4 | `api/lib/config.php` | **REPLACE** | **yes** | Configuration loader. Adds the canonical `AERO_*` names, the per-mode recipient table, the approval flags, and blanks the invented `smtp_host` default. **Contains no credentials** — safe to read. |
| 5 | `api/lib/mailmode.php` | **ADD** | no | **New.** Decides who may receive mail for the configured mode, and refuses when it is not authorised. This file is the reason a half-configured server cannot email a customer. |
| 6 | `api/lib/mailer.php` | **REPLACE** | **yes** | The SMTP client. Only a password requirement fix: a configured mailbox is now asked for a password, rather than demanding one even when there is no mailbox to authenticate as (which broke local capture). |
| 7 | `api/lib/request.php` | **REPLACE** | **yes** | Adds an explicit `post_max_size` comparison so an oversized submission is reported as too large. Previously PHP discarded the body and the visitor was told their fields were missing. |
| 8 | `api/lib/forms.php` | **REPLACE** | **yes** | Field validation and the two email templates. Unchanged in substance; shipped to keep the endpoint and its templates in step. |
| 9 | `api/lib/guard.php` | **REPLACE** | **yes** | Origin check, rate limiter, logging, secret masking, and the private-directory helper. Unchanged in substance. |
| 10 | `api/lib/uploads.php` | **REPLACE** | **yes** | Attachment intake, typed by file contents. Unchanged in substance. |
| 11 | `api/.htaccess` | **REPLACE** | **yes** | Apache twin of the IIS rules. Now also covers the new example templates and `aero-config.php`. |
| 12 | `api/lib/.htaccess` | **REPLACE** | **yes** | Denies the library folder on Apache hosts. Unchanged in substance. |
| 13 | `api/config.example.php` | **REPLACE** | **yes** | Reference: every setting, both environment-variable spellings, and what each mode is allowed to do. Documentation only — never loaded. |
| 14 | `api/config.local.example.php` | **ADD** | no | Local demo template: capture into a local SMTP server, never deliver. |
| 15 | `api/config.production.example.php` | **ADD** | no | Production template with placeholders: sample review first, then approved live delivery, and how to move between them. |

### Deliberately not in the package

| Excluded | Why |
|---|---|
| `out/` and its `index.html` | The site is already live. It is not repackaged, and its homepage is never at risk from a backend upload. |
| `api/config.php` | Credentials. Typed on the server, not uploaded. |
| `api/data/`, `api/logs/` | Created by the host on first submission, together with their own `.htaccess`. Uploading them would publish local test state. |
| `MANIFEST.json` | It *is* in the archive, for reference on the server; it is not an application file. |

**Untracked files that must travel with this upload.** Four files the endpoint
cannot run without are absent from Git history — `public/web.config`,
`public/.htaccess`, `public/api/lib/config.php` and `public/api/lib/mailmode.php`
— because they were git-ignored when the site was first deployed. The ignore
rules are fixed, and three of the four are in this package (`web.config`,
`api/lib/config.php`, `api/lib/mailmode.php`), so this upload is complete even
from a fresh clone. `public/.htaccess` is the site-root Apache twin; the backend
does not need it, it is already deployed inside the export as `out/.htaccess`,
and it is deliberately not added to an IIS document root by this package.

**Nothing in this work has been committed to Git.** Until those three files are
added, this package is the only complete copy of them.

### What this package changes, relative to what is deployed

The diagnostic report found that **the deployed backend is older than the
source**, so a file-by-file list is not enough on its own — the point of the
upload is that all 15 files end up from the same revision. The differences that
matter:

| Area | Deployed | This package |
|---|---|---|
| IIS responses | `existingResponse` left at its default, so every non-2xx body was replaced by an IIS error page; 404s upgraded to HTTP 200 | `existingResponse="PassThrough"`, 404 served from `404.html` as a real 404 |
| `api/lib/` | No `mailmode.php` — nothing decided who could receive mail | `mailmode.php` refuses to send unless the mode's mailbox settings are complete and its approval flag is set |
| SMTP host | A hardcoded `smtp_host` that **does not resolve** | Blank, with the missing key named by `health.php` |
| Diagnostics | No health endpoint | Token-gated `health.php`; 404 to everyone until a token is set |
| Oversized bodies | Reported as *missing fields* | Reported as too large |
| `api/lib/config.php` | Loader without the mode table or the canonical `AERO_*` names | Current loader; contains no credentials |
| `api/data/`, `api/logs/` | Reachable over HTTP on IIS | Denied by `web.config` and by `.htaccess` |

---

## 2. Upload procedure

```
1.  Back up, from httpdocs/:
        web.config
        api/submit.php   api/health.php   api/.htaccess
        api/config.example.php
        api/lib/         (whole folder)

2.  Upload the CONTENTS of aerocotton-api-upload.zip into httpdocs/.
    In the Plesk file manager that is "extract here" in httpdocs/.

3.  Add the credentials — aero-config.php beside httpdocs/ (recommended),
    Plesk environment variables, or httpdocs/api/config.php.
    Do not upload them in the archive.

4.  Verify:  https://aerocotton.in/api/health.php?token=<health_token>
```

Then work through the post-deployment checklist in
[PRODUCTION_HANDOVER.md](PRODUCTION_HANDOVER.md) §6.

### Rollback

Restore the six backed-up paths from step 1. The endpoint returns to its
previous behaviour immediately; no database, no migrations, no other state. The
only thing to check afterwards is that `api/health.php` still answers, since the
restored `web.config` will again hide PHP's JSON on failures — which is exactly
the condition the upload exists to fix.

The three added files (`api/lib/mailmode.php`, `api/config.local.example.php`,
`api/config.production.example.php`) are not in the backup and are left behind by
a file rollback. That is harmless and needs no action: nothing loads them once
the restored `submit.php` is in place (`mailmode.php` is required only by the
newer `submit.php`, and the two `config.*.example.php` files are documentation
that PHP never includes). Leave them or delete them — the only difference is
three inert files in `api/`.

---

## 3. Manual review before uploading

Three items need a decision, not just a copy:

1. **`web.config`** replaces hosting rules that also serve the whole site, and
   **the live copy cannot be read from outside** — production answers every
   missing path with `404.html`, so fetching it proves nothing. So do not
   overwrite it blind. Merge it instead:

   a. Copy `httpdocs/web.config` to `web.config.backup-<date>` (or download it).
      That copy is the rollback.
   b. Read it and note any section this package's file does not have — most
      likely `<handlers>` (the PHP handler mapping) or `<rewrite>` (rewrite
      rules added by Plesk). Those are not part of this change and must not be
      lost.
   c. Upload this package's `web.config`, then paste any such section back in
      under `<system.webServer>`, before its closing tag.
   d. If the live file has nothing extra, the upload is a complete replacement.

   What this package's file **changes**: `<httpErrors
   existingResponse="PassThrough">` with the 404 rule in `responseMode="File"`,
   a new `<security><requestFiltering><hiddenSegments>` block, `.log` refused by
   extension, and the MIME maps for the export's media. `<defaultDocument>` and
   `<staticContent>` are carried here because the export depends on them; if the
   live file already has them, keep whichever copy matches the host's PHP setup.
2. **The mailbox settings** in `aero-config.php` must be confirmed with the
   provider. They ship **blank**, not as placeholders — a placeholder reads as a
   value, and the endpoint would then report "cannot reach the mail server" for
   what is really an unset key. Work through
   [SMTP_CONFIGURATION_CHECKLIST.md](SMTP_CONFIGURATION_CHECKLIST.md) §2 before
   filling anything in.
3. **`mail_mode` must be `sample` for the first run**, with only
   `mail_sample_approved` set. Live delivery to `export@aerocotton.in` is
   switched on separately, after the client approves the sample
   ([SMTP_CONFIGURATION_CHECKLIST.md](SMTP_CONFIGURATION_CHECKLIST.md) §8).
4. **`health_token` ships blank**, which makes `/api/health.php` answer 404 to
   everyone. That is deliberate: it fails closed rather than accepting a token
   printed in a shipping file. Generate one before relying on the page.

---

## 4. Regenerating this manifest

```
npm run pack:api
```

It rewrites `api-package/`, `api-package/MANIFEST.json` and the archive, prints
the same table as §1, and fails without writing an archive if a required file is
missing or a credential has crept in.

## 5. What was verified about this archive

Checked on the archive itself, after extraction — not assumed from the pack
script's exit code:

| Check | Result |
|---|---|
| Contents and layout | 16 files — the 15 application files plus `MANIFEST.json`, all at `httpdocs/`-relative paths, no wrapper folder (the archive's 19 records include the three directory entries) |
| Every file identical to `public/` | **PASS** — all 15 byte-identical to the source tree (`cmp`) |
| No site file | **PASS** — no `.html`, `_next/`, `images/`, `.glb` or `.mp4` entry |
| No operator credentials file | **PASS** — no `api/config.php` in the archive |
| Every credential key blank | **PASS** — the only non-blank value is `health_token` in the *local demo* template, which is `local-demo`, allows nothing but a loopback capture server, and is whitelisted by name in the packer's scan |
| The invented SMTP host | **PASS** — `mail.aerocotton.in` appears nowhere in the archive |
| Magic bytes | **PASS** — `PK`; a tar fallback would have been deleted rather than shipped as a `.zip` |
| The protected export | **PASS** — 542/542 pinned files SHA-256 identical after packing; `out/index.html` still `2026-10-09 07:52` |
