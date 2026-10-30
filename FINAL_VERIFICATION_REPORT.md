# Aerocotton contact system — consolidated verification report

Date: 15 October 2026 · Branch: `main` · Nothing committed, staged or deployed.

This is the single report for the whole task: what was inspected, what was
broken, what was repaired, what was measured, and what is still blocked. Every
number below was produced in this session by running the thing in question —
live HTTP, a real browser, a real PHP interpreter, a real SMTP exchange. Where
something could not be tested, it is marked **BLOCKED** or **NOT EXERCISED**
rather than passed.

The three earlier reports ([TEST_REPORT.md](TEST_REPORT.md),
[SMTP_AUDIT_REPORT.md](SMTP_AUDIT_REPORT.md),
[LOCAL_SAMPLE_EMAIL_VERIFICATION.md](LOCAL_SAMPLE_EMAIL_VERIFICATION.md)) describe
the state before this session. They were re-read and their claims re-checked
against the working tree rather than trusted.

---

## 1. Root causes found

### 1.1 The homepage enquiry section never reached the endpoint (the headline defect)

`https://aerocotton.in` has two ways to enquire. The Contact page posts to
`/api/submit.php`. The homepage's "Start with a brief." section did not post
anywhere at all: [RfqForm.tsx](src/components/rfq/RfqForm.tsx) built a
`mailto:` URL from `NEXT_PUBLIC_RFQ_EMAIL` and assigned it to
`window.location.href`, handing the enquiry to whatever mail client the visitor
happens to have.

That variable is set nowhere — it exists only as a line in
[.env.example](.env.example) — so the component took its own "not configured"
branch:

```
Enquiry delivery is not configured yet. Please add NEXT_PUBLIC_RFQ_EMAIL before launch.
```

This is not a development-only problem. The **built, deployed** export carries
that branch: `out/_next/static/chunks/234znfnysq_bk.js` contains the string
`Enquiry delivery is not configured`. So the homepage's primary conversion
form has been non-functional on the live site, and could never have worked:

| What the second path lost | Because |
|---|---|
| Any delivery at all | the address it gated on was never configured |
| Server-side validation | the endpoint was never called |
| Rate limiting, honeypot, origin check | same |
| A reference number the visitor can quote | no response was ever parsed |
| Failure handling | a `mailto:` navigation cannot fail visibly |
| Attachments | `mailto:` cannot carry them |

It also carried a **second, unmaintained field contract**: its
`Product / collection` list came from a private `PRODUCT_OPTIONS` array in
[src/lib/rfq/schema.ts](src/lib/rfq/schema.ts) with 13 values, while the server
validates against its own 15-value `AERO_INTEREST_OPTIONS`. A dead `compact`
variant contained the same `mailto:` path.

### 1.2 Nothing was guarding the wiring (why 1.1 survived a "complete verification")

The suite covered the endpoint exhaustively — 33 checks — but not one of them
asserted that a frontend form posts to it. The verification was deep in one
direction and absent in the other, so a form that bypassed the endpoint
entirely was invisible to it. The option-list mirroring is even documented as a
"keep these in step" hazard in both [options.ts](src/lib/forms/options.ts) and
[forms.php](public/api/lib/forms.php), and no test enforced it.

### 1.3 What was *not* broken

The backend chain was audited end to end and held up: `submit.php` method /
origin / honeypot / timing / Turnstile / rate-limit / validation / upload
ordering, the three mail-mode gates in [mailmode.php](public/api/lib/mailmode.php),
the SMTP client, the IIS and Apache private-path rules, and the runtime-state
handling. No defect was found in any of it. The Contact page, the Support page
and the endpoint contract were already consistent.

---

## 2. Files changed and why

| File | Change | Why |
|---|---|---|
| [src/components/rfq/RfqForm.tsx](src/components/rfq/RfqForm.tsx) | Rewritten to submit through the shared, tested path: `useSubmission("contact")` → `POST /api/submit.php?form=contact`. Same markup, same class names, same ids. | Removes the second delivery path and the unset-address gate. Root cause 1.1. |
| | Its `customization` answer is folded into the message (`Customization requirements: …`) instead of being posted as a field the endpoint does not know. | The endpoint's contact contract is fixed; folding keeps the visitor's words without inventing a field. |
| | Its `Product / collection` list now comes from `INTEREST_OPTIONS`, and the field is named `interest`. | One contract instead of two. The deep-link values the catalogue uses (`Nature collection`, …) are in that list. |
| | Success renders the shared `FormReceipt`; failure renders the shared `FormError`; Turnstile uses the shared `TurnstileField`. | Both entry points now behave identically, including the reference number, the retry advice and the unreachable-endpoint fallback. |
| [tests/forms.test.mjs](tests/forms.test.mjs) | New: 11 checks (see §7). | Guards root cause 1.1 and 1.2: it fails if any form submits by navigating to a `mailto:` URL, if the two entry points' fields diverge, if a form declares a field the endpoint does not validate, or if an option list drifts from the server's. |
| [tests/api.test.mjs](tests/api.test.mjs) | One test added (`2b.`) for the unknown/missing form identifier. | The brief's scenario list names it and it had no coverage; it is a real 400 path. |
| [package.json](package.json) | `test` now runs the third suite; `test:forms` added. | Makes the new guard permanent rather than optional. |

No backend file, no `.htaccess`, no `web.config`, no `out/` file and no
deployment-package file was touched. `public/` and `api-package/` are
byte-identical to how this session found them.

---

## 3. Dedicated Contact page — results

Served over real HTTP from an isolated export of the final source, same origin
as the PHP endpoint, talking to a real Mailpit capture server.

| Check | Result |
|---|---|
| Page loads from the static export | **PASS** — `GET /contact/` → 200, title "Contact — request a quote — Aero Cotton" |
| Field names are the endpoint's | **PASS** — `name company email phone country interest message files[] website` |
| Select and attachment input present and wired | **PASS** — `interest` is a `<select>`, `files[]` is `multiple` (attachment *content* is covered at the API level, §6) |
| Loading state, no accidental double submit | **PASS** — submit disabled and relabelled "Sending…" while in flight |
| Valid enquiry → genuine success + reference | **PASS** — receipt "Request Received", reference **AH‑2026‑000015**, "A confirmation has been emailed to you" |
| Rejected request → the backend's own message | **PASS** — see §6 |
| Failure never looks like success | **PASS** — see §6 |
| Retry keeps what the visitor typed | **PASS** — after a 502 the fields were still populated and "Everything you entered is still here" was shown |
| Deep link `?product=<Collection> collection` | **PASS** — `?product=Nature%20collection` selected `Nature collection` |
| No credentials or internals in browser errors | **PASS** — failure text is visitor-facing only |

---

## 4. Homepage enquiry section — results

The same stack, a real Chromium page, the final build.

| Check | Result |
|---|---|
| Section renders and hydrates | **PASS** — form present at `#rfq-name` |
| Posts the Contact page's contract | **PASS** — `name company email phone country interest message website` |
| No `mailto:` submission anywhere in the section | **PASS** — verified in the built HTML *and* in the built JS |
| No `NEXT_PUBLIC_RFQ_EMAIL` on the page | **PASS** — the shipped "not configured" branch is gone |
| Valid enquiry → genuine success + reference | **PASS** — reference **AH‑2026‑000016** (final build) |
| Two messages captured, no duplicates | **PASS** — notification + acknowledgement |
| Only the reserved test recipient | **PASS** — `dev@aerocotton.test`, Reply-To = the visitor |
| The extra `customization` answer survives | **PASS** — it appears in the notification body |
| Loading / duplicate-submit behaviour | **PASS** — button disabled and relabelled while sending |
| Layout, navigation, responsive shell unchanged | **PASS** — the markup, classes and ids are the ones that were there |

A second, independent submission of the same form earlier in the session
produced reference **AH‑2026‑000014**; the same reference appears in both
captured messages.

---

## 5. Local HTTP and sample-email results

### 5.1 The documented local command

```
npm run mail:start                 # local capture  (mail:start exit 0)
npm run mail:start -- --mode sample # sample review (mail:start exit 0)
npm run sample:send                # HTTP 200, reference, mailMode "sample"
```

Both modes start with the documented commands and no manual setup. The capture
server's real command line was read back from the process:

```
mailpit.exe --smtp 127.0.0.1:1025 --listen 127.0.0.1:8025 --database … --smtp-allowed-recipients (?i)@(…)$
```

- `--smtp-relay*` / `--smtp-forward*`: **absent**
- `--smtp-auth-file` is added **only** in sample mode, because local capture
  sends no credentials by design
- both sockets bind `127.0.0.1` only; the endpoint binds `127.0.0.1` only

### 5.2 SMTP authentication (sample mode)

| Probe | Result |
|---|---|
| `EHLO` capabilities | `250-AUTH LOGIN PLAIN` |
| Correct password (stack's own synthetic pair) | **235 2.7.0 Authentication successful** |
| Wrong password | **535** |
| Unauthenticated session | **530 5.7.0 Authentication required** — refused before `RCPT` is even evaluated, so an unauthenticated session cannot deliver anything |

### 5.3 Recipient restriction

| Recipient | Authenticated | Unauthenticated |
|---|---|---|
| `sample-review@aerocotton.test` (reserved) | **250 2.1.5 Ok** | 530, refused |
| `jeinfonet@gmail.com` (the real reviewer) | **550 5.1.0 mailbox unavailable** | 530, refused |
| `export@aerocotton.in` (the production inbox) | **550 5.1.0 mailbox unavailable** | 530, refused |

### 5.4 Sample-mode capture

`npm run sample:send` → HTTP 200, reference, `mailMode: "sample"`, `acknowledged: true`.
Captured: **exactly 2** messages, both to `sample-review@aerocotton.test`, both
prefixed `[SAMPLE FOR REVIEW]`, both carrying the sample banner, no duplicate,
the reference in the acknowledgement, no credential anywhere in either body.
9/9 capture checks and 5/5 SMTP checks passed.

### 5.5 Endpoint health, reported by the endpoint itself

```
mode local · delivery_enabled true · recipient dev@aerocotton.test
sender website@aerocotton.test · smtp 127.0.0.1:1025 plaintext
problems [] · warnings [] · data_writable true
```

`GET /api/health.php` with no token → **404**. With the token → the JSON above.

---

## 6. Error-scenario matrix

`PASS` means observed in this session. Nothing here is inferred.

| Scenario | Status | Evidence |
|---|---|---|
| Valid enquiry (both entry points) | **PASS** | §3, §4 |
| Missing required fields | **PASS** | suite `2.` — 422, one message per field, all fields at once |
| Invalid email / malformed values | **PASS** | suite `2.` |
| Unknown form identifier (and none at all) | **PASS** | suite `2b.` — 400, "which form" |
| Invalid request method | **PASS** | suite `3.` — 405 + `Allow: POST, OPTIONS`; OPTIONS → 204 |
| Malformed JSON | **PASS** | suite `4.` — 400 |
| Oversized JSON body | **PASS** | suite `4.` — 413 |
| Body past `post_max_size` | **PASS** | suite `4b.` — 413 with a size message, not "your fields are missing" |
| Attachment accepted / disguised file refused | **PASS** | suite `attachments:` — content sniffed with finfo |
| Attachment too many / too large / not a permitted type | **PASS** | suite `attachments:` + `4b.` |
| Honeypot filled | **PASS** | suite `14b.` — silent success, no message sent |
| Submitted faster than a person can type | **PASS** | suite `14b.` |
| Turnstile required but invalid/absent | **NOT EXERCISED** | no Turnstile secret is configured anywhere, so `aero_turnstile_ok()` is a no-op. Verified by reading the code; cannot be observed without a site/secret pair |
| Foreign origin | **PASS** | suite `14a.` — 403; known origin accepted and CORS echoed, never `*` |
| Rate limit exceeded | **PASS** | suite `5.` — 429 with a retry hint |
| SMTP server unavailable | **PASS** | browser: HTTP 502 → honest failure text + reference, **no false success**; suite `7.` |
| SMTP authentication failure | **PASS** | suite `8.`; live 535 in §5.2 |
| SMTP sender rejected | **PASS** | suite `7b.` |
| SMTP recipient rejected | **PASS** | suite `7b.`; live 550 in §5.3 |
| SMTP timeout / silence | **PASS** | suite `7b.` |
| Host answers with HTML instead of JSON | **PASS** | browser probe host returning `500 text/html` → "The enquiry service is not responding from this address." No raw HTML reached the page |
| Host answers 200 with a non-JSON body | **PASS** | browser probe host returning `200 application/octet-stream` → same honest message |
| JSON parses but is not an object | **NOT EXERCISED** | the `isOutcome()` branch in [submit.ts](src/lib/forms/submit.ts) is two lines and was read, not driven; the non-JSON case above exercises the same visitor-facing outcome |
| Endpoint unreachable (connection refused) | **PASS** | browser: the server was killed under a loaded form → "We could not reach the server." + retry note + input preserved |
| Client-side 60 s timeout / aborted connection | **NOT EXERCISED** | `AbortController` path exists but was not driven; the *server-side* silence timeout is covered by suite `7b.` |
| Duplicate clicks / repeated submissions | **PASS** | submit disabled while in flight (observed in the browser); suite `5.` covers the server side |
| Production delivery not approved | **PASS** | suite `17.` — refused, and refused again after a sample |
| Sample mode pointed at an external SMTP host | **PASS** | guard exits 1: "Refusing to start sample mode against mail.example.com" |
| `--mode production` on a laptop | **PASS** | guard exits 1: "Refusing to start in production mode" |
| Real recipient attempted in local/sample mode | **PASS** | suite `16.`; live 550 in §5.3 |
| Missing / invalid health token | **PASS** | HTTP 404 without it; suite `9a.`/`9b.` |
| Incomplete mailbox configuration | **PASS** | suite `6.`, `19.` — refuses and names what is missing |
| Runtime storage not writable | **PASS** | reported by `health.php`; rate limiting degrades to skipped, references fall back to random (read, not forced) |

Both stack guards were run by hand in this session and both exited 1 without
starting anything (ports stayed closed).

---

## 7. Automated tests and typecheck

```
npm test          → 45 tests, 45 pass, 0 fail, exit 0
npm run typecheck → exit 0
```

| Suite | Checks | What it covers |
|---|---|---|
| `tests/api.test.mjs` | 34 | the whole endpoint: delivery, validation, methods, bodies, rate limits, mail modes, SMTP failures, attachments, IIS/Apache rules, health, the shipped-configuration rule, the `AERO_*` name contract |
| `tests/export.test.mjs` | 3 | every one of the 542 deployed files still byte-identical |
| `tests/forms.test.mjs` | 11 | **new** — §2 |

The new suite reads the server's side by *executing* the real PHP, so the
authority is the code that runs in production:

1. the endpoint validates exactly the fields the Contact page posts;
2. the homepage form posts the *same* contract, not a near copy;
3. the Support form is the support contract;
4. the only extra field names are `files[]` and `website`;
5. the browser's option lists are identical to `AERO_INTEREST_OPTIONS`,
   `AERO_CATEGORY_OPTIONS`, `AERO_PRIORITY_OPTIONS`;
6. every collection the catalogue deep-links with is offered *and* accepted;
7. no component anywhere in `src/` submits by navigating to a `mailto:` URL;
8. both enquiry entry points go through the shared submission path;
9. there is exactly one `fetch()` between the two forms.

**The guard was proven to bite.** Re-introducing a `mailto:` submission in a
scratch component failed the suite (`exit 1`, naming the file); renaming the
posted field from `interest` to `product` failed it too
("the homepage form and the contact page must post the same fields"). Both were
reverted and the suite passed again.

---

## 8. Static export integrity

`out/` is the site already live in `httpdocs`, so it is pinned and was measured
before and after every step.

| Measurement | Result |
|---|---|
| Files hashed at the start of this session | 542 |
| Files hashed at the end | 542, **every SHA‑256 identical**, none added, none removed |
| `out/index.html` | untouched — still `2026‑10‑09 07:52`, 48,181 bytes |
| `tests/export.test.mjs` | **PASS** — the fixture compares all 542 |
| Builds performed this session | two, both into the git-ignored `out-verify/` via `NEXT_DIST_DIR`, then deleted |

**The live homepage form is therefore still the old, broken one.** `out/` holds
the pre-fix build, and the preservation rules forbid rebuilding it in this task.
The source is fixed and verified; the *deployed* homepage enquiry section stays
non-functional until a rebuild is authorized — see §15.

---

## 9. Package and manifest verification

`aerocotton-api-upload.zip` (42,079 bytes) and `api-package/MANIFEST.json` were
inspected directly, and the archive was extracted and compared file by file.

| Check | Result |
|---|---|
| Manifest entries | 15 — **12 `replace` + 3 `add`** |
| Entries marked `backupFirst` | 12 of 15 (exactly the replacements) |
| `extractInto` | `httpdocs/` |
| Archive contents vs `public/` | **15/15 byte-identical** — no source fix was needed, so the package was **not** regenerated |
| Replacement destinations | all under `httpdocs/api/` plus `httpdocs/web.config` |
| Site files in the package (`index.html`, `_next`, `images/`, `hero/`, `models/`, `brand/`) | **none** |
| `api/config.php` (the credentials file) | **excluded** |
| Filled-in credential in any packaged file | **none** (only the blank templates) |
| `MANIFEST.json`'s list agrees with the archive listing | **yes** — 19 archive entries = 15 files + 3 directories + the root |

The three `add` entries (`config.local.example.php`,
`config.production.example.php`, `mailmode.php`) are additions, so no rollback
is needed for them beyond deleting what did not exist before; the 12
replacements are the ones that need backups.

---

## 10. Backup and rollback

Nothing was deployed, so nothing was backed up as part of a deployment. The
state that matters is intact and verifiable:

- `out/` — 542/542 files byte-identical to the baseline (§8); a restorable
  archive of it exists from the earlier work at
  `.pdf-work/protect/out-protected-2026-10-12.tar.gz` (git-ignored).
- The deployment package is unchanged and still matches `public/` exactly (§9).
- The live site was never connected to, so no live file, credential or
  configuration was read, written or backed up.
- **The 12 documented backups are still owed at deploy time** — the manifest's
  `backupFirst` flags are the list, and they must be taken and verified before
  any file is replaced. They cannot be taken without the access in §15.

---

## 11. Live deployment status — **BLOCKED**

No deployment happened. This is a hard blocker, not a preference.

| Question | Finding |
|---|---|
| Is there a stored credential? | **No.** The only transfer host configured anywhere is `216.10.253.21:21` in the local FileZilla profile, with username `aerocott_p2hrnfciupr` and **no password stored** (`passStored: false`, 0 characters). No trusted-certificate entry, nothing in the queue, no credential file in the workspace. |
| Plain FTP (port 21) | **Reachable.** Forbidden by the rules — a password must never cross it. Not used. |
| SFTP (port 22) | **Not available.** Connection times out / is filtered. |
| HTTPS (443) | Reachable. |
| Plesk over HTTPS (8443) | **Reachable** — a secure channel could exist, but it needs a session credential that does not exist locally and must not be typed into a chat. |

DNS resolves `aerocotton.in` → `216.10.253.21`. No credential was requested,
printed, guessed or reused. No workaround was invented: the boundary is real.

---

## 12. Live endpoint and IIS results

**Not tested — no deployment.** Specifically unverified, and deliberately not
claimed:

- `GET /api/submit.php` returning **405 with JSON** on the real IIS (the check
  that proves `existingResponse="PassThrough"` is doing its job)
- genuine 404s for unknown API paths
- that `api/lib/`, `api/data/`, `api/logs/`, `api/config.php` and `web.config`
  cannot be downloaded on the live host
- `/api/health.php` against the real mailbox
- the real `web.config` merge (IIS ignores `.htaccess`, so on this host the
  manifest's rules are the only thing protecting the library and the logs)

`public/web.config` and `public/api/.htaccess` were validated as XML/rules and
asserted by the suite (`12.`, `13b.`), but **that is not the same as merging
them into the live configuration**, which must be inspected first.

---

## 13. SMTP configuration and email status

- **Local capture and sample review: verified** (§5).
- **Real provider SMTP: not verified, and still not identified.**
  [SMTP_AUDIT_REPORT.md](SMTP_AUDIT_REPORT.md) found Google Workspace MX records
  and a default host (`mail.aerocotton.in`) that does not resolve. Neither was
  re-tested as changed; they cannot be tested without the mailbox
  administrator's answer.
- **STARTTLS / implicit TLS: not verified.** The only server available is the
  plaintext loopback capture server; the mailer verifies peer certificates
  strictly and refuses self-signed ones, which is a control worth keeping
  rather than weakening to obtain a local green tick.
- **External delivery and inbox receipt: not verified, and never claimed.**
  SMTP acceptance is not proof of arrival.
- **SPF / DKIM / DMARC: still absent**, per the audit. Mail sent as
  `@aerocotton.in` has no authenticated identity and will be rejected or
  spam-filtered by major providers even once the host and credentials are
  right. This is a DNS/admin blocker, not a code defect.
- **Production mode remains disabled.** `mail_production_approved` is false and
  `mail_sample_approved` is false in the shipped defaults; the real recipient
  is blank in the production template.
- **No real email was sent at any point in this session.** Every message went
  into a loopback Mailpit. The two guard runs in §6 that could have started a
  stack exited 1 and started nothing.

---

## 14. Security findings and remaining risks

Intact and re-verified: mode gating, the approval flags, recipient validation,
loopback-only capture, no relay or forwarding flags, origin checking, rate
limiting, honeypot and timing traps, upload content sniffing with `finfo`,
certificate verification, `X-Content-Type-Options`, `no-store` on every
response, and the secret-masking in the logs. Secrets live only in
`public/api/config.php` (git-ignored, denied by both host rule sets) or in
`AERO_*` environment variables; nothing credential-shaped appears in the
package, the export, the browser bundle or any captured message.

Risks and limitations that remain:

1. **The live homepage form is broken until `out/` is rebuilt** (§8) — the
   highest-impact open item.
2. **`mail_allow_loopback_relay`** is what makes the local sample rehearsal
   possible. `health.php` reports it as a warning whenever it is on, and it
   must never be set on a host that can reach the internet.
3. **No SPF, DKIM or DMARC** — delivery-quality risk independent of this code.
4. **The deployed export carries no `mailmode.php`.** The export-integrity test
   asserts that on purpose: the new backend files must be *uploaded*, not
   assumed to travel with the site.
5. **Turnstile is configured nowhere**, so the CAPTCHA path is dormant. The
   endpoint runs on the honeypot, timing check and rate limiter alone.
6. **No HTTPS termination, rate-limit concurrency or real-IIS behaviour** has
   been exercised; `php -S` is single-threaded, so no two requests raced.
7. **`src/lib/rfq/schema.ts` is now unused.** It is left in place rather than
   deleted — the new suite fails if any form imports a second option list, so
   it cannot quietly become a contract again.

---

## 15. Unresolved blockers and the single next action

**Blocker 1 — secure access (blocks deployment).** Supply one of:

- a Plesk session for `216.10.253.21:8443` over HTTPS, or
- an **SFTP** account (which also requires SFTP to be enabled on the host —
  port 22 is currently filtered),

and take the 12 documented backups before anything is replaced. A password must
not be pasted into chat; put it in a private file and name the file.

**Blocker 2 — the mailbox configuration (blocks real delivery).** Confirm with
whoever administers `@aerocotton.in`: the provider, host, port, encryption, and
whether `export@aerocotton.in` exists and is authorised to receive. Then set the
production `smtp_*` keys and the approving operator flag, and run
`health.php?token=…&probe=1`.

**Single next action:** authorize a rebuild of `out/` from the fixed source
(`npm run build`, reviewed as a diff, then the export-integrity fixture
regenerated deliberately) and the upload of the verified package. That is what
turns the fixed homepage enquiry section into a working one on the live site;
everything else on the site-package side is ready, and deployment is waiting
only on the secure channel in Blocker 1.

---

## 16. Reproducing everything in this report

```
npm run mail:start                      # capture stack, loopback only
npm run mail:start -- --mode sample     # sample review (auth required)
npm run sample:send                     # one sample through the real endpoint
npm run mail:status
npm run mail:stop
npm test                                # 45 checks, three suites
npm run typecheck
NEXT_DIST_DIR=out-verify npx next build # isolated build — never touches out/
node scripts/normalize-segment-payloads.mjs --dir out-verify
```

The scratch scripts this session used for the SMTP probes and the sample-mode
verification live in the git-ignored `.pdf-work/` directory
(`verify-sample-mode.mjs`, `verify-sample-rcpt.mjs`, `verify-rcpt.mjs`).

No local server is running: nothing is listening on 1025, 8025, 8787, 4181 or
4182, no `mailpit.exe` or `php.exe` of ours remains, the sample password file is
gone with the process that read it, and the throwaway build trees
(`out-verify/`, `out-htmlprobe/`) have been deleted. The captured test messages
are left in the local Mailpit scratch database under `.pdf-work/`, which is
git-ignored. Nothing is staged or committed.

---

## 17. Amendment — 19 October 2026

After §15's recommendation, `out/` was rebuilt (`npm run build`, 10:32 local).
This section records what that changed, a defect it exposed, and what the live
host was then observed to be doing.

### 17.1 The export now carries the repair, and the baseline moved with it

The rebuild produced 545 files (was 542): 8 build artefacts replaced, and 11
added — `web.config`, `config.local.example.php`, `config.production.example.php`
and `api/lib/mailmode.php`. Before the integrity fixture was re-pinned, the new
tree was checked:

- `out/index.html`, `contact/`, `about/`, `products/`, `support/` and
  `customer-care/` all still carry their titles and expected size;
- the homepage chunk now contains `api/submit.php` and no longer contains the
  `Enquiry delivery is not configured` branch — the headline defect is gone from
  the artefact that ships;
- `out/api/` is byte-identical to `public/api/` apart from the local runtime
  state the build strips (`data/`, `logs/`), and there is no private
  `out/api/config.php` and no credential or `smtp_pass` value in any chunk.

`/out/` is git-ignored, so the previous bytes cannot be restored; the baseline
has to describe the export that will actually be uploaded. It was therefore
re-pinned to the 545 verified files, and the assertion that required
`mailmode.php` to be **absent** (it meant "the export predates the backend
change") was replaced with one that requires `out/api/submit.php`,
`out/api/lib/mailmode.php`, `out/api/lib/config.php` and `out/web.config` to be
byte-identical to their `public/` sources — a stronger guard against shipping a
stale backend. Verified after the change: 545 pinned, 545 present, 0 problems.

### 17.2 New defect found and fixed: the local preview served PHP as a file

The error in the 19 October screenshot — *"Your request was not sent. The
enquiry service is not responding from this address."* — could be produced
locally, with no host involved. `scripts/serve-export.mjs` served the export as
plain files, so `POST /api/submit.php` answered **200
`application/octet-stream`** with the endpoint's own source (`<?php …`), and
`submit.ts` took its `JSON.parse` failure branch. It also handed out
`api/config.example.php` and would have handed out `api/config.php`.

Fixed in [serve-export.mjs](scripts/serve-export.mjs): `/api/submit.php` and
`/api/health.php` are proxied to a managed `php -S` child, every other `api/`
path answers 404 JSON, PHP source is never served, runtime state is redirected
under `.pdf-work/`, the bound port is added to the origin allowlist, and the
child is stopped with the server ([stop-tree.mjs](scripts/lib/stop-tree.mjs) is
used by both callers so Windows cannot orphan `php.exe`). Regression assertions
were added to test 15, and the same requests now answer 405/400/422/404 as
JSON.

### 17.3 Both entry points, in the rebuilt export, through a browser

With `npm run mail:start` and the preview serving `out/`:

| Entry point | Result | Reference |
| --- | --- | --- |
| Contact page, `#enquiry-*` form | success receipt | `AH-2026-000001` |
| Homepage "Start with a brief." form | success receipt | `AH-2026-000002` |

Six captured messages (notification + acknowledgement for each submission, plus
one older pair): every recipient `dev@aerocotton.test`, every sender
`website@aerocotton.test`, no real mailbox anywhere. For the homepage
submission the `customization` field appears **exactly once** in the
notification body, folded into the message as designed. `npm test` 45/45 exit 0;
`npm run typecheck` exit 0.

### 17.4 What the live host is doing (measured, not inferred)

The live backend is running PHP and **is not** the current code, and the live
`web.config` is still the old one. Every error body is destroyed by IIS:

| Request | Live status | Live body | Same request, local PHP |
| --- | --- | --- | --- |
| `GET /api/submit.php` | 405 | IIS XHTML page (1293 B) | JSON `This endpoint accepts POST requests only.` |
| `POST …?form=contact`, invalid email | 422 | `The custom error module does not recognize this error.` | JSON with per-field errors |
| `POST /api/submit.php`, no form | 400 | `Bad Request` (11 B) | JSON `We could not tell which form that was…` |
| `OPTIONS /api/submit.php` | 200 | empty | 204 |
| `GET /api/health.php` | 200 | the **homepage** HTML | 404 when no token |
| `GET /api/does-not-exist.php` | 200 | the **homepage** HTML | 404 |

The 405 response still carries PHP's own `Allow: POST, OPTIONS`,
`Cache-Control: no-store` and `X-Content-Type-Options: nosniff`, so PHP ran and
its headers survived — only the body was replaced. That is
`httpErrors existingResponse="Replace"` in the live `web.config`, and it is what
turns every real reason into "not responding from this address". The 200-on-
missing-path and the presence of the homepage instead of `health.php` show the
new `web.config` and the new backend are **not** deployed.

Conclusion: the code is sound in both entry points; the live failure is the host
configuration, and only the verified package upload (12 `REPLACE`, 3 `ADD`,
`web.config` merged into the live one) changes it. That remains **BLOCKED** on
the secure channel described in §11 — no credential exists in this workspace,
port 22 is filtered, port 21 is plain FTP and was not used.
