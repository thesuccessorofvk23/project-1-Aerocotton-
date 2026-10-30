# Test report

What was actually executed, what it proved, and what it did not.

```
npm test           33 tests · 33 pass · 0 fail · exit 0 · 13.7s     (14 Oct 2026)
npm run typecheck  exit 0
npm run pack:api   exit 0 · 16 archive entries, audited after extraction
```

Nothing is mocked. Each scenario starts a real `php -S` server over HTTP and
reads the mail back out of a real SMTP capture server (Mailpit v1.31.5). A
message the endpoint claims to have sent is not counted as sent until it is
found in the capture inbox.

---

## 1. Environment

| | |
|---|---|
| PHP | 8.4.26 (NTS, Visual C++ 2022 x64), bundled at `.pdf-work/tools/php/php.exe` |
| Extensions | openssl, mbstring, fileinfo, json, SimpleXML, dom, libxml |
| Node | v24.14.1 |
| SMTP capture | Mailpit v1.31.5, started by the suite on loopback with OS-assigned ports |
| Command | `npm test` → `node --test tests/api.test.mjs tests/export.test.mjs` |

The suite starts its own Mailpit on ports the OS picks, so a developer's own
instance — or a stale one from an interrupted run — can never be mistaken for
the suite's. Both binds are loopback only.

---

## 2. Results by required area

| # | Required area | Test | Result |
|---|---|---|---|
| 1 | Valid form submission | `1. a valid contact submission is delivered and reported` | **PASS** — 200, reference `AH-YYYY-NNNNNN`, two messages accepted by SMTP |
| 2 | Missing and invalid fields | `2. missing and invalid fields are rejected field by field` | **PASS** — 422 per field; three bad fields produce three errors |
| 3 | Unsupported HTTP methods | `3. unsupported methods are refused with the allowed set` | **PASS** — GET/DELETE 405 with `Allow`, OPTIONS 204 |
| 4 | Malformed and oversized requests | `4.` and `4b.` | **PASS** — malformed JSON 400; 1.2 MB JSON 413; a body past `post_max_size` 413 with no field errors |
| 5 | Rate limiting | `5. the rate limiter refuses the third rapid submission` | **PASS** — `[200, 200, 429]` and a `rate_limited` log entry |
| 6 | Missing SMTP configuration | `6. an unconfigured or unapproved mailbox refuses to send` | **PASS** — 503 for all four states; the reason is in the log, not the response |
| 7 | SMTP connection failures | `7. an unreachable mail server produces an honest failure` | **PASS** — 502, reference kept, `delivery_failed` logged with the cause |
| 8 | SMTP authentication failures | `8. an authentication rejection produces an honest failure` | **PASS** — a fake SMTP server returns `535`; 502 and the password is masked out of the log |
| 7b | Sender, recipient and timeout handling | `7b. a refusal at the sender or recipient stage fails honestly, and silence times out` | **PASS** — a fake server refusing `MAIL FROM` or `RCPT TO` with `550` produces 502, a kept reference, the reply in the log only, and never a success; a server that accepts the connection and then says nothing hits the read timeout (~5.6 s) instead of hanging |
| 9 | End-to-end local SMTP capture | all of 1, 10, 10b, 10c, 17 | **PASS** — every asserted message was read back out of Mailpit |
| 10 | Recipient, subject, Reply-To and body | `10.`, `10b.`, `10c.` | **PASS** — recipient forced, `Reply-To` is the enquirer, From is the configured mailbox, both MIME parts carry every field and the reference |
| 11 | Correct JSON responses | `11. responses are valid, uncacheable JSON with the expected shape` | **PASS** — `application/json`, `no-store`, `nosniff`, shape checked on success and failure |
| 12 | IIS response compatibility | `12. the IIS configuration is shaped for this endpoint` | **PASS (static)** — `web.config` is valid SimpleXML and carries `PassThrough`, the 404 rule and no `ExecuteURL`. **Live IIS behaviour is NOT verified — see §4** |
| 13 | Runtime-file access restrictions | `13a.` and `13b.` | **PASS** — every `api/lib/*.php` answers 404 standalone and leaks nothing; `web.config` and `.htaccess` both deny `lib`, `data`, `logs` and the config file |
| 14 | Secret exposure prevention | `8.`, `9b.`, `13a.` and the packer's own scan | **PASS** — no password in any response, log or the health report; the archive is refused if a filled-in password is staged |
| 15 | Existing routes and contact page | `15. the exported site still answers for its own routes` | **PASS** — six routes 200 over HTTP with the form's fields present; a missing path 404 |
| 16 | Demo isolation from production | `16. a demo cannot reach a real mailbox even when told to` | **PASS** — a real recipient or a provider host in `local` mode is refused three ways, and nothing is delivered |
| 17 | Sample and production transitions | `17. sample review and production delivery each need their own approval` | **PASS** — sample without approval 503 (area 6); approved sample → reviewer only, marked; approved production → company inbox plus a confirmation to the enquirer; no approval, no delivery |
| 18 | Preventing unauthorised real delivery | `18. nothing in this suite left a real recipient on the wire` | **PASS** — the whole run produced at most the two production assertions, both captured on loopback |
| 19 | Preservation of the protected export | `export.test.mjs` (3 checks) | **PASS** — 542 files, every SHA-256 identical, none added, none removed, form markup intact |
| 20 | No shipped file offers an unverified setting | `19. every shipped configuration leaves the mailbox blank` | **PASS** — every `smtp_host`/`smtp_user`/`smtp_pass` assignment in `public/api/**` is blank, `health_token` is blank in the loader and the production template, both approval flags are `false`, and `mail.aerocotton.in` appears in no shipped PHP file |
| 21 | The documented `AERO_*` interface | `20. the documented AERO_* names are the ones the endpoint reads` | **PASS** — `AERO_MAIL_TO`/`AERO_MAIL_FROM` read back off the wire, `AERO_SMTP_HOST`/`PORT`/`PASS` and `AERO_HEALTH_TOKEN` confirmed through `health.php`, and neither the password nor the token is echoed |

### Additional checks in the suite

| Test | Result |
|---|---|
| Foreign origin refused, known origin allowed with CORS headers | **PASS** |
| Honeypot and too-fast submissions answered as success, with no mail sent | **PASS** |
| Attachment carried intact; a PHP script named `.pdf` refused | **PASS** |
| Health endpoint hides itself (404) without or with a wrong token | **PASS** |
| Health separates configuration / connectivity / authentication / acceptance / delivery, and never sends mail | **PASS** |

---

## 3. Defects found and fixed by the tests

Four of these were in the code this task inherited. Each was found by a test
failing for a reason, not by inspection.

| Defect | How it surfaced | Fix |
|---|---|---|
| The mailer demanded `smtp_pass` even when no mailbox was configured to authenticate as, so **every local-capture delivery failed** and reported a configuration error for a setup that was complete | Tests 1, 5, 10, 10b, 10c, 17 all returned 502 | The password is required only when `smtp_user` is set |
| An oversized form body was reported as **missing fields**, because PHP discards the body before the script runs and the old check depended on how the host surfaced that | Test 4b returned 422 with five "please enter your …" errors for a 900 KB submission | Explicit `post_max_size` comparison plus the empty-superglobals signature |
| The success array in the new mail-mode plan had no `from` key, so every successful send reported a null sender | The mode matrix printed `from=` empty while the resolver returned the right value | Key added |
| `api/lib/config.php` — the loader, which must ship — was git-ignored, and the packer's name-based exclusion then dropped it from the upload package as well | The packer's own completeness check refused to build | Ignore rule removed; exclusions are now scoped to `api/config.php` and verified by a `REQUIRED` list |
| A **second submission endpoint and a second mailer** still sat in the tree: `src/lib/rfq/actions.ts` (a `"use server"` action), `send.ts` (Resend, default sender `onboarding@resend.dev`) and `rate-limit.ts`. Nothing imported the action — the homepage form only used `schema.ts` — and a server action cannot run on a static export regardless | Found by auditing for duplicate mailers, as the brief requires; confirmed unreferenced by a repo-wide grep, and by `tsc --noEmit` passing after removal | The three files were deleted. `schema.ts` stays; it is live |

Two failures were in the tests themselves and are recorded here rather than
quietly corrected:

- a loop mis-destructured its cases, so three scenarios ran against **default**
  configuration and shared one data directory; the daily limit then produced a
  misleading `429`. Corrected, and the cases are now named.
- `-d error_log=<Windows temp path>` made PHP abort its ini parsing with
  `syntax error, unexpected '~'` and then **silently ignore every later `-d`
  option** — including the `post_max_size` the test was setting. The harness now
  uses a repo-relative log path, verified by probing `ini_get()` with each argv
  shape.

---

## 3b. The deployed export is not byte-reproducible

Worth recording, because it changes how `out/` should be guarded.

Building the current tree twice, back to back, with the same command and nothing
changed in between, produces **two different exports**: 267 of 528 site files
differ between the two builds. The differences are the build ID, content-hashed
asset filenames, and the inline Next payloads that reference them.

The **rendered copy does not differ**: with `<script>` and `<style>` bodies and
tags removed, all six sampled pages — homepage, about, contact, support, 404 and
a product page — hash identically across the deployed export and both builds.

Two consequences:

1. "Rebuild and compare" can never be the guard on `out/`, because a rebuild
does not reproduce it even from an unchanged tree. Pinning every file by
   SHA-256 ([tests/fixtures/protected-export.sha256](tests/fixtures/protected-export.sha256))
   is the guard that works, and it is what `tests/export.test.mjs` enforces.
2. Deploying a fresh build is a reviewed act with a real diff, not a no-op.
   Anyone replacing the live site should expect every asset filename to change
   and should check the rendered pages, not the hashes.

This also means the removal of the dead modules in §3 is proven safe by the
rendered-copy comparison and by `tsc --noEmit`, **not** by a byte comparison of
the export — that comparison cannot be made in this project.

---

## 4. Not verified — and why

Listed because a report that only lists passes is not useful.

| Not verified | Why | What would verify it |
|---|---|---|
| **Delivery to the real inboxes** (`export@aerocotton.in`, `jeinfonet@gmail.com`) | No credential for the real mailbox has been available. Delivery has only ever been to the local capture server | The health probe, then one real submission; §6 of PRODUCTION_HANDOVER.md |
| **A real provider's SMTP** (host, port, encryption, authentication) | The provider has not been identified. MX points at Google Workspace; `mail.aerocotton.in` does not resolve. The shipped default is blank | `health.php?token=…&probe=1` against the confirmed settings |
| **STARTTLS and implicit TLS** | The only SMTP server available is the capture server, run in plaintext. The mailer verifies peer certificates strictly and refuses self-signed ones — so it cannot be pointed at a locally-generated certificate without weakening that check, which was not worth doing to a security control | A probe against the real provider, which reports the TLS stage |
| **Behaviour on real IIS** | No IIS exists in this environment. `web.config` was validated as XML and asserted for the settings that matter | Check #2 in PRODUCTION_HANDOVER §6 — `GET /api/submit.php` must return **405 with JSON**, not an HTML page |
| **The host's PHP version and extensions** | The production host has not been queried | `health.php` reports both |
| **Outbound SMTP egress from the host** | Cannot be tested from here; some shared hosts block it | The probe |
| **Rate limiting under concurrent load** | `php -S` is single-threaded, so requests did not race. The lock is a per-request file rewrite with `LOCK_EX` | A load test against the real host; the counter and window files are in `api/data/` |

### Tests that passed with a stated caveat

**Test 17 (the approval transitions)** used `mail_allow_loopback_relay`, the
documented escape hatch that relaxes exactly two checks — that a real send is
not aimed at loopback, and that the connection is encrypted — so that the sample
and production *routing* could be exercised end to end. The approval gates, the
credentials requirement, the recipient routing, the subject prefixes and the
banners are all real and all asserted; the transport is not. `health.php` reports
the setting as a warning whenever it is on, so it cannot be left in place
silently. It must never be set on a host that can reach the internet.

---

## 4b. What was verified about the already-deployed export

| Check | Method | Result |
|---|---|---|
| Nothing in the live tree changed | 542 files hashed before the work and after | **PASS** — every SHA-256 identical, no file added or removed |
| The build cannot overwrite it by accident | `NEXT_DIST_DIR` opt-in redirect, exercised twice; the default path is untouched | **PASS** — builds landed in a throwaway directory and were deleted |
| A backup exists outside version control | `tar -czf` of the whole tree into the git-ignored scratch directory | **PASS** — 31.6 MB, `index.html` present, restorable |
| The backend package carries no site file | Archive listing checked for `index.html`, `404.html`, `_next`, `images` | **PASS** — 19 entries, none of them a site file |
| The backend package carries no credential | `api/config.php` excluded by name, plus a scan of every staged file for a filled-in `smtp_pass` or `health_token` | **PASS** |

**Not done, deliberately:** the protected files were not marked read-only on
disk. That would make the project's own documented `npm run build` fail, which
is a worse outcome than the protection it buys — `out/` is guarded by the
hash fixture and its test instead, and that test fails loudly on any edit.

---

## 5. Reproducing

```
npm run mail:start          # Mailpit (1025/8025) + PHP (8787), detached
npm run mail:status         # what is running
npm test                    # 33 checks; starts its own capture server
npm run test:export         # export integrity alone
npm run mail:stop
```

The suite needs no network access and no credentials. It never contacts a
mailbox outside loopback.

---

## 6. Final pass — 14 October 2026

What was re-run and changed in this pass, so the numbers above and the state of
the repository agree.

**Changed**

| File | Change | Why |
|---|---|---|
| [public/api/config.production.example.php](public/api/config.production.example.php) | `smtp_host`, `smtp_user`, `smtp_pass` and `health_token` now ship **blank** instead of as placeholder strings (`CONFIRM-WITH-PROVIDER`, `PUT-THE-MAILBOX-PASSWORD-HERE`, `PUT-A-LONG-RANDOM-STRING-HERE`); `smtp_secure` is blank so changing the port alone still selects the right encryption | A placeholder is not blank. With `smtp_host = 'CONFIRM-WITH-PROVIDER'` the mail-mode gate sees a configured host, so it reports *"cannot reach the mail server"* — the same unactionable symptom as the original bug — instead of naming the missing key. A placeholder health token is worse still: it would unlock `health.php` for anyone who has read the template. Blank fails closed and `health.php` names what is missing |
| [tests/api.test.mjs](tests/api.test.mjs) | Three tests added (`7b.`, `19.`, `20.`) | The blank-settings rule and the canonical `AERO_*` spellings were requirements with no test behind them, and the brief's "sender acceptance / recipient acceptance / timeout behaviour" list had no coverage at all — the suite only ever failed a send by *not reaching* the server. All three are now asserted against a real socket |
| [package.json](package.json), `package-lock.json` | `resend` and its four transitive packages removed | The Resend mailer was deleted earlier in this work, so the dependency was dead — but it still advertised a second delivery path in the manifests. Nothing imported it; `tsc --noEmit` and the suite both still pass, and the lockfile diff is exactly `resend` + `postal-mime`, `standardwebhooks`, `@stablelib/base64`, `fast-sha256` |
| [SMTP_CONFIGURATION_CHECKLIST.md](SMTP_CONFIGURATION_CHECKLIST.md) | New | The deliverable list required it: the questions only the mailbox administrator can answer, where each value goes, and the failure-to-meaning table |

**Re-verified after those edits**

| Check | Result |
|---|---|
| `npm test` | **33/33 pass**, exit 0 — including the three new tests and the three export-integrity checks |
| `npm run typecheck` | exit 0 |
| Export backup still restorable | `.pdf-work/protect/out-protected-2026-10-12.tar.gz` (git-ignored): 618 entries, 53 `index.html` files, and `out/` has not changed since it was taken |
| `npm run pack:api` | exit 0; 15 files staged, 3 to add and 12 to replace |
| Archive contents, after extraction | 16 files (15 application files + `MANIFEST.json`); all 15 byte-identical to `public/`; no site file; no `api/config.php`; no credential-shaped value except the local demo's `local-demo` token |
| The protected export | 542/542 files SHA-256 identical to the pre-work baseline; `out/index.html` still `2026-10-09 07:52`. Nothing was written to `out/` at any point |
| A real email sent | **None.** Every message in every run went to the loopback capture server |
