# Local sample-email verification — contact-form backend

> **Locally captured only.** Every message below was handed to a capture server
> on `127.0.0.1` and never left this machine. **No external SMTP was contacted,
> no mail was delivered to any inbox, and nothing was verified about the
> production mailbox, TLS to a real provider, or external delivery.** The
> deployment remains blocked on secure hosting access, exactly as before.

|  |  |
|---|---|
| Date | 2026-10-15 |
| Endpoint under test | [public/api/submit.php](public/api/submit.php), served by PHP 8.4.26 (`php -S`) |
| Capture server | Mailpit v1.31.5, loopback only, **no relay configured** |
| Mail mode exercised | `sample` |
| Result | **PASS** — one valid enquiry accepted, two messages captured, zero duplicates, zero secrets |
| Source files changed | none for this verification; §10 records the follow-up fix to the local stack |

---

## 1. What the existing infrastructure turned out to be

Read before running anything, not assumed:

| Piece | Finding |
|---|---|
| `scripts/dev-mail-stack.mjs` | the documented `npm run mail:start` / `mail:stop` / `mail:status`. Starts Mailpit (`SMTP 127.0.0.1:1025`, inbox `127.0.0.1:8025`) and `php -S 127.0.0.1:8787 -t public`, detached, PIDs in `.pdf-work/dev-stack.json`; only processes it started are ever stopped |
| `scripts/send-sample-enquiry.mjs` | the documented sample sender; posts to `/api/submit.php?form=contact`; explicitly labelled sample content; never switches the server to production |
| `public/api/lib/mailmode.php` | the gate. `local` needs a reserved recipient **and** a loopback host; `sample` needs `mail_sample_approved`; `production` needs `mail_production_approved` plus host, user, password and sender. Approval is never inferred |
| `public/api/lib/config.php` | environment variables win over a config file; `AERO_MAIL_TO`, `AERO_MAIL_FROM`, `AERO_SMTP_ENCRYPTION`, `AERO_MAIL_MODE` are the canonical spellings |
| `tests/lib/harness.mjs` | real `php -S` per scenario, real Mailpit per run on OS-picked ports, with `--smtp-auth-accept-any --smtp-auth-allow-insecure` so an *authenticated* exchange can complete locally |
| `tests/api.test.mjs` | 28 backend scenarios; every claimed send is read back out of Mailpit |
| Config files present locally | **none** — no `public/api/config.php`, no `aero-config.php`, so the whole run was environment-driven and nothing was read from disk |

**One fact that shaped the run — since fixed, see §10.** `sample` mode refuses to
send unless `smtp_user` and `smtp_pass` are set, and the `npm run mail:start` of
the time started Mailpit with **no SMTP authentication at all**, so the documented
development command could not complete a sample-mode exchange. This run therefore
stood the capture server up by hand with the flags the repo's own harness uses
(`--smtp-auth-accept-any --smtp-auth-allow-insecure`) on the documented ports, and
started PHP with the documented command beside it. §10 records the fix that
removes that workaround — and, better than accept-any, makes a wrong password
genuinely refused.

---

## 2. Local configuration used (no secrets)

Capture server (scratch helper `.pdf-work/start-capture.mjs`, git-ignored):

```
mailpit.exe --smtp 127.0.0.1:1025 --listen 127.0.0.1:8025
            --database .pdf-work/mailpit-data/mailpit.db
            --smtp-auth-accept-any --smtp-auth-allow-insecure
            --smtp-allowed-recipients "@(aerocotton\.test|example\.com)$"
```

`--smtp-allowed-recipients` is not part of the repo's own setup; it was added for
this task so the capture server itself refuses any recipient outside the reserved
test domains. Its log confirms:
`[smtp] only allowing recipients matching regexp: @(aerocotton\.test|example\.com)$`.

Endpoint environment (`npm run mail:start` with these exported):

```
AERO_MAIL_MODE=sample
AERO_MAIL_SAMPLE_APPROVED=1
AERO_MAIL_ALLOW_LOOPBACK_RELAY=1
AERO_SMTP_HOST=127.0.0.1
AERO_SMTP_PORT=1025
AERO_SMTP_ENCRYPTION=
AERO_SMTP_USER=sample-review@aerocotton.test
AERO_SMTP_PASS=<synthetic, see note>
AERO_MAIL_TO=sample-review@aerocotton.test
AERO_HEALTH_TOKEN=local-demo
```

Three deliberate choices, each because the task forbids the alternative:

- **`AERO_MAIL_TO` overridden to a reserved `.test` address.** `sample` mode's own
  recipient is the reviewer's real mailbox (`jeinfonet@gmail.com`). Contacting a
  real mailbox is out of scope, so the same sample-mode path was exercised with
  the recipient moved to an unroutable reserved name. The mode, the gate, the
  subject prefix, the banner and the routing are all the real ones.
- **`mail_allow_loopback_relay=1`** — the documented escape hatch that lets a
  *real* delivery path be exercised against a local capture server. `health.php`
  reports it as a warning (it did), and it must never be set on a host that can
  reach the internet.
- **`AERO_SMTP_PASS`** is a string invented for this run
  (`local-capture-only-not-a-real-password`). It is not a credential: it appears in
  no captured message (see §6), in no repository file, and only in git-ignored scratch.

---

## 3. Endpoint state before submitting

`GET http://127.0.0.1:8787/api/health.php?token=local-demo` →

```
mail.mode: sample | delivery_enabled: true
recipient: sample-review@aerocotton.test | sender: admin@aerocotton.in
smtp: {"host":"127.0.0.1","port":1025,"encryption":"none","user":"sample-review@aerocotton.test",
       "password_set":true,"timeout":30}
problems: []
warnings: ["mail_allow_loopback_relay is set: real delivery is being exercised against a local relay.
            Remove it on any host that can reach the internet."]
```

Without the token the same URL answers **404** for everyone — the page fails
closed. The password is reported only as `set: true, length: 38`.

---

## 4. The submission

The capture inbox was emptied first (`DELETE /api/v1/messages` → 0 messages), then
the documented sender was run:

```
node scripts/send-sample-enquiry.mjs --url http://127.0.0.1:8787
```

**Endpoint response — HTTP 200:**

```json
{
  "ok": true,
  "reference": "AH-2026-000007",
  "acknowledged": true,
  "mailMode": "sample",
  "submittedAt": "15 October 2026, 9:44 PM IST",
  "message": "Thank you. Your request has been successfully submitted. …"
}
```

`acknowledged: true` and `ok: true` are recorded only after the SMTP server
accepted the message — the endpoint's own log for this submission reads
`{"event":"…","form":"contact","reference":"AH-2026-000007","mail_mode":"sample",
"ip":"…","attachments":0,"acknowledged":true}`. The converse (success is *not*
reported when SMTP is missing, unreachable, rejecting, or silent) is covered in §7.

The two messages in Mailpit's store are themselves the proof the SMTP transaction
happened against the local server: Mailpit stores only what it accepted over SMTP,
and it has no relay configured that could forward them anywhere.

---

## 5. Capture confirmation and routing

```
captured messages: 2
```

| | message 1 (notification) | message 2 (acknowledgement) |
|---|---|---|
| From | `Aerocotton Website <admin@aerocotton.in>` | `Aerocotton Website <admin@aerocotton.in>` |
| To | `sample-review@aerocotton.test` | `sample-review@aerocotton.test` |
| Reply-To | `sample@example.com` (the enquirer) | — |
| Subject | `[SAMPLE FOR REVIEW] New Contact Inquiry - Aerocotton` | `[SAMPLE FOR REVIEW] Aerocotton - Request Received [AH-2026-000007]` |
| Body | 1 151 chars text · 5 401 chars HTML | 767 chars text · 3 450 chars HTML |
| Attachments | 0 | 0 |

- **Exactly the expected pair, and no third message.** One submission in `sample`
  mode produces the notification *and* the acknowledgement, both directed to the
  reviewer so a single inbox shows the whole exchange. Distinct
  subject/body fingerprints: **2 of 2**; exact duplicates within the batch: **0**.
- **One recipient in the entire batch:** `sample-review@aerocotton.test`. No real
  mailbox was addressed at any point.
- **Sender is the intended one:** `admin@aerocotton.in`, i.e. `mail_sample_from`,
  the configured sample-mode sender. The header carries the real address by
  design; nothing was transmitted from it.
- **Subject routing is correct:** both carry the `[SAMPLE FOR REVIEW]` prefix, and
  the acknowledgement carries the reference in its subject.
- **The banner is present** (text part, capped):

```
SAMPLE FOR REVIEW — NOT A REAL ENQUIRY
This is exactly what a live enquiry notification will look like: same subject, sender,
Reply-To and layout. The details inside it are placeholders.
It has been delivered to the reviewer only (sample-review@aerocotton.test). Live delivery
to the company inbox stays switched off until this sample is approved.
```

- **The reference appears in both messages:** `messages containing the reference AH-2026-000007: 2`.
- The notification body reproduces the submitted fields, including
  `Reference: AH-2026-000007` and `Submitted At: 15 October 2026, 9:44 PM IST`.

---

## 6. Contents inspection

Scan over both captured messages (subject, text, HTML and headers):

| Sought | Found |
|---|---|
| the synthetic SMTP password | **0** |
| the literal key `smtp_pass` | **0** |
| the word "password" | **0** |
| the health-token key or its value (`local-demo`) | **0** |
| any PHP config assignment (`KEY =>`) | **0** |
| the operator config filename `aero-config` | **0** |

Cross-checked through Mailpit's own search API: `local-capture-only-not-a-real-password` → 0 messages, `local-demo` → 0, `AERO_` → 0.

**Personal data:** the message bodies contain only the sample script's clearly
labelled placeholders (`Sample Reviewer (not a customer)`, `sample@example.com`,
`+00 00000 00000`, "not a real customer request"). No real enquirer data is
involved, and nothing from the client's mailbox or credentials appears.

**One thing to know rather than hide:** Mailpit records the *authenticated SMTP
username* in its own `Username` field (`sample-review@aerocotton.test` here). A
real capture run would therefore show the mailbox address — never the password.
The `Message-ID` is generated in the `aerocotton.in` domain by the mailer.

---

## 7. Safety-gate results

### 7.1 Live probes against the endpoint (no submission, health-only)

Five configurations, five refusals — `delivery_enabled=false` every time:

| Configuration | Refusal |
|---|---|
| `sample`, loopback SMTP, no `mail_allow_loopback_relay` | `A real send is pointed at a loopback SMTP host.` |
| `sample`, `smtp.gmail.com`, no credentials | `smtp_user is not configured.` / `smtp_pass is not configured.` |
| `local`, `smtp.gmail.com` | `Local capture mode is pointed at smtp.gmail.com, which is not this machine.` |
| `local`, recipient `someone@gmail.com` | `would deliver to someone@gmail.com, which is not a reserved test address.` |
| `production`, approved, no credentials | `smtp_user is not configured.` / `smtp_pass is not configured.` / `No valid sending address is configured.` |

A half-configured `sample` or `production` mode therefore cannot silently fall
back to a real provider, and a local demo cannot address a real mailbox.

### 7.2 Existing test suite, `npm test` — **33/33 pass, exit 0**

| Requested gate | Scenario that proves it |
|---|---|
| Sample-mode routing | 17 (`sample` approved → reviewer only, `[SAMPLE FOR REVIEW]` subject and banner) |
| Production remains gated | 6 (`production` without approval → refused), 17 (production approved → company inbox, no banner) |
| Invalid payload rejection | 2 (field-by-field), 3 (method), 4 / 4b (malformed and oversized bodies) |
| SMTP connection / send failure | 7 (unreachable port → 502, honest message, reference kept, `delivery_failed` logged) |
| Sender / recipient rejection | 7b (refusal at MAIL FROM and at RCPT TO → honest failure, SMTP reply never reaches the visitor) |
| SMTP timeout | 7b (a silent server times out) |
| Correct JSON error responses | 11 (valid, uncacheable JSON, expected shape), 2, 3, 4 |
| Authentication rejection | 8 (server refuses the password → honest failure, logged as `535`) |
| A demo cannot reach a real mailbox even when told to | 16 |
| Nothing left a real recipient on the wire | 18 |
| Deployment/package integrity | 12, 13a, 13b, 19, 20 |
| The export is untouched | the four export assertions (542 pinned files byte-identical, no new files, pages intact) |

**No test needed adapting.** Each one either targets loopback or asserts the
refusal; tests 7/8/7b use their own minimal SMTP servers on OS-picked ports.

**One honest caveat.** Test 17's `sample` and `production` scenarios necessarily
address the real reviewer (`jeinfonet@gmail.com`) and the real company inbox
(`export@aerocotton.in`) in the SMTP envelope — that is what the routing assertion
is about — and deliver them into the loopback capture server. Test 18 exists
precisely to bound that: those two are the only permitted occurrences, and nothing
is relayed. Neither certificate validation nor any production setting was
weakened for any test to pass. This is the same caveat
[TEST_REPORT.md](TEST_REPORT.md) §4 already records for test 17: the approval
gates, the credentials requirement, the routing, the prefixes and the banners are
real, **the transport is not**, and `health.php` reports the relay setting as a
warning whenever it is on.

TEST_REPORT.md is otherwise consistent with everything measured here — the same
33/33, the same 542/542 byte-identical export, the same "a real email sent:
**none**", and the same production-only gaps listed in §9 below.

---

## 8. Test results, failures and cleanup

- `npm test` → **33/33 pass, exit 0** (run during this task, after the live submission, so the export assertions cover the post-run tree).
- `npm run typecheck` → **exit 0**.
- **No source file was changed by this task.** `git status --porcelain` lists the same 43 entries as before the task began; no tracked file was modified, staged or committed, and no file in `public/`, `tests/`, `scripts/` or the deployment package was edited. No defect was found that required a code change.
- **Failures:** none.
- **Cleanup:** `npm run mail:stop` → `api stopped (pid 6260)`. The capture server was not started by that script, so its recorded PID (9500) was verified to be `mailpit.exe` and then terminated: no `mailpit.exe` processes remain, and **nothing is listening on 1025, 8025 or 8787**. The dev-stack state file is back to `{mailpit: null, api: null}`. The scratch probe state was removed.
- **Left in place deliberately:** `public/api/data/` and `public/api/logs/` hold the runtime state this run produced (a counter, two rate files, one log entry). Both paths are git-ignored, and the repo's own cleaner
  ([scripts/clean-api-runtime-state.mjs](scripts/clean-api-runtime-state.mjs)) documents that it deliberately **never touches `public/`** — "the local server needs its state to keep working between builds" — so removing them would be an undocumented change. They are not part of `api-package/` or the upload archive, and `out/` is untouched.
- The two captured messages remain in the git-ignored Mailpit database at `.pdf-work/mailpit-data/mailpit.db` (synthetic only) so the capture can be inspected later; delete that file to clear the inbox.

---

## 9. What this does and does not prove

**Proven, locally:**

1. A valid enquiry posted to the real endpoint in `sample` mode is accepted (HTTP 200, `ok`, reference, `acknowledged`).
2. It produces the expected two messages in a real local capture server, addressed only to the reserved test recipient, correctly prefixed and bannered, carrying the reference.
3. No duplicate messages are generated by one submission.
4. The captured mail contains no credential, token, private configuration, or real personal data.
5. Every approval and routing gate holds, and every failure mode returns honest JSON without leaking SMTP detail.

**Not proven — production only, and unchanged by this work:**

- Real SMTP to the actual mailbox provider: host, port, encryption, authentication, app password.
- External delivery to `jeinfonet@gmail.com` or `export@aerocotton.in`, and receipt in either inbox.
- SPF/DKIM/DMARC behaviour on a real send.
- Outbound SMTP from the hosting account at all.
- IIS behaviour of the deployed `web.config`, and the `health.php?probe=1` mailbox probe on the host.

**Do not read this report as evidence that email works.** It is evidence that the
backend's acceptance, routing, gating and message construction are correct, proven
against a capture server on this machine.

---

## 10. Follow-up fix — the documented stack now runs sample mode

### Root cause of the startup mismatch

`npm run mail:start` launched Mailpit with no authentication options at all, so
the capture server did not advertise `AUTH`. Mailpit authenticating is not
optional for the review flow, because `aero_mail_plan()` refuses to send in
`sample` mode unless a mailbox is configured — a `sample` send always
authenticates. The two facts together made the documented command unable to
exercise the one mode that precedes go-live, which is why §1 had to assemble the
capture server by hand.

### Files changed

| File | Change | Why |
|---|---|---|
| [scripts/dev-mail-stack.mjs](scripts/dev-mail-stack.mjs) | Optional `--mode <local\|sample>`; the capture server's **authentication now follows the mode** (password file for `sample`, none for `local`) with `--smtp-allowed-recipients` in both; sample-mode endpoint defaults; five start-time guards, including one against reusing a capture server started for the other mode; mode and capture-auth state recorded and reported by `mail:status` | One place owns the capture server's configuration, and the documented command can now reach the review flow |
| [README.md](README.md) | "Running it locally" documents the new command, what the capture server enforces, and the guards | The workflow is documented where a developer looks for it |

**Nothing else changed.** No backend file, no test, no `web.config`, no `.htaccess`,
and nothing in `api-package/` or the upload archive — the local stack is developer
tooling and is not deployed. `out/` was not touched, rebuilt or regenerated.

### The documented command that now works

```
npm run mail:start -- --mode sample     # Mailpit (auth required) + PHP, sample mode
npm run sample:send                     # posts the sample through the real endpoint
npm run mail:status                     # processes and mode
npm run mail:stop                       # stops both, removes the password file
```

`npm run mail:start` with no arguments is unchanged (`local` capture mode).

### Authentication: why it follows the mode, and what the first attempt got wrong

The harness's `--smtp-auth-accept-any` would have been the smallest change, but it
accepts *any* password, so "verify that an incorrect password is rejected" could
not have been verified against it. Checking Mailpit 1.31.5's options and then
testing the format showed `--smtp-auth-file` takes `user:pass` per line, so the
first implementation started the capture server with a password file **in both
modes**, handing the endpoint the same synthetic pair for `sample`.

**That broke `local` mode**, and the end-to-end check caught it: one submission
returned **HTTP 502** where it had returned 200 before. `local` capture sends no
credentials at all (`smtp_user` is blank by design — `config.local.example.php`
documents it), and Mailpit with a password file refuses an unauthenticated
session. A regression in the *default* command is exactly what a no-argument run
has to be used to find.

The fix came from measuring the three candidate flag sets side by side rather
than guessing:

| Mailpit configuration | Unauthenticated send (`local` needs this) | Wrong password refused | Right password accepted (`sample` needs this) |
|---|---|---|---|
| `--smtp-auth-file` + `--smtp-auth-allow-insecure` | **no** — refused | yes (535) | yes (235) |
| the same **plus** `--smtp-auth-accept-any` | — | — | — |
| no auth flags (the original) | **yes** | no | no — AUTH not advertised |

The middle row is not available: Mailpit exits with
`[smtp] authentication cannot use both credentials and --smtp-auth-accept-any`.
So **no single configuration serves both modes** — the two modes genuinely need
opposite things — and the capture server's authentication is now set from the
requested mode: a password file for `sample`, none for `local`. That also keeps
`local` capture exactly as it was, including for a developer using the shipped
`config.local.example.php` with its blank credentials.

Because a mismatch is silent at startup and only surfaces at the first send, the
stack now records which authentication it started with and **refuses to reuse a
capture server started for the other mode**, telling the user to stop it first. If
it finds a capture server it did not start, it probes `EHLO` (read-only, no
message) and reports whether AUTH is advertised, refusing when `sample` mode is
asked for against a server that cannot authenticate.

Nothing in the repository contains a credential: the file is written on start,
holds the stack's own synthetic pair, is git-ignored, and is removed on `mail:stop`.

### SMTP AUTH and recipient-restriction results

Measured on the running documented stack (raw SMTP dialogue, and the endpoint):

| Check | Result |
|---|---|
| `EHLO` advertises AUTH | **yes** — `250-AUTH LOGIN PLAIN` |
| The stack's own credentials | **235 2.7.0 Authentication successful** |
| A **wrong** password | **535 5.7.8 Authentication credentials invalid** |
| Reserved recipient (`sample-review@aerocotton.test`) | **250 2.1.5 Ok** |
| Real recipient (`jeinfonet@gmail.com`) | **550 5.1.0 refused at RCPT** |
| Relay / forwarding flags on the running process | **none** — the full command line carries no `--smtp-relay-*` or `--smtp-forward-*` |
| Bind addresses | **127.0.0.1 only** for SMTP 1025, inbox 8025 and the endpoint 8787 |
| Unauthenticated session in `local` mode | **250 accepted** — the endpoint sends no credentials there, which is why the auth setting is per-mode |
| `local` mode end to end after the change | **HTTP 200**, 2 messages, `[LOCAL CAPTURE]` prefix, recipient `dev@aerocotton.test` |
| Reusing a capture server started for the other mode | **refused**, exit 1, with the fix in the message |

The endpoint was then told to deliver to the real reviewer against this capture
server: it reported **HTTP 502, `ok: false`** with the visitor-facing message
"We could not deliver your request just now…", the capture inbox **did not grow**,
and the message named no SMTP detail. A real recipient cannot be reached from the
local stack, and the failure is honest rather than silent.

Five start-time guards were exercised and each exits 1 without starting anything,
leaving any running stack untouched: `--mode production`; sample mode with
`AERO_SMTP_HOST=smtp.gmail.com`; sample mode with `AERO_MAIL_TO=someone@gmail.com`;
an unrecognised mode; and asking for the other mode while a capture server is
already running.

### End-to-end capture through the documented command

One `npm run sample:send` against `npm run mail:start -- --mode sample`:

- **HTTP 200**, `ok: true`, `mailMode: sample`, `reference AH-2026-000012`, `acknowledged: true`.
- **Exactly 2 messages** captured (notification + acknowledgement) — 2 of 2 distinct fingerprints, **0 duplicates**.
- **One recipient** in the entire batch: `sample-review@aerocotton.test`.
- Both carry the `[SAMPLE FOR REVIEW]` prefix and the sample banner; the reference appears in both.
- **0 secret findings** across subject, bodies and headers.
- `health.php`: `delivery_enabled: true`, recipient reserved, `problems: []`, and the
  `mail_allow_loopback_relay` warning present (as designed — that flag is why the
  transport is synthetic).

### Test and typecheck results

- `npm test` → **33/33 pass, exit 0** (re-run after the final change, not only
after the first attempt).
- `npm run typecheck` → **exit 0**.

The suite starts its own capture server, so it does not cover the documented
command; that path was therefore checked separately, in both modes, at each step
of the change — which is what exposed the `local`-mode regression above.

### Cleanup

`npm run mail:stop` stopped both recorded processes, **removed the password file**,
and left the state file at `{mailpit: null, api: null, mode: null,
 captureAuth: null}`. Afterwards: **no `mailpit.exe` process and nothing listening
on 1025, 8025 or 8787.** This was confirmed after the sample-mode run, after a
`local`-mode run, and again after the final run. The scratch probe databases and
probe auth files created while establishing the format and the flag matrix were
deleted. `public/api/data/` and `public/api/logs/` were left as before, for the
reason given in §8.

Nothing was staged or committed, no unrelated working-tree change was touched, and
the deployment package and the exported site were not modified.

### No external email was sent

**None.** Every message in this work went to `127.0.0.1:1025`, whose command line
has no relay and no forwarding flag; the only addresses ever accepted at `RCPT`
were reserved test names, everything else was refused with 550; and no real
mailbox credential exists on this machine to authenticate with.

### Remaining limitations

Unchanged from §9: real provider SMTP, STARTTLS/implicit TLS, authentication
against the real mailbox, external delivery and inbox receipt, SPF/DKIM/DMARC,
host egress and real IIS behaviour remain **unverified**, and the deployment is
still blocked on secure hosting access. The local sample mode also relies on
`mail_allow_loopback_relay`, so its **transport is synthetic** — it rehearses the
routing, the approval gate and the credentials requirement, not the wire.
