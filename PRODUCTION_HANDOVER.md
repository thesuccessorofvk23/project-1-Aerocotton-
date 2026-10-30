# Production handover — the contact form backend

Everything an operator needs to take this live on BigRock (Plesk on Windows,
IIS 10), and to move from a sample for review to real delivery.

Read this with [DEPLOYMENT_MANIFEST.md](DEPLOYMENT_MANIFEST.md) (what to upload)
and [TEST_REPORT.md](TEST_REPORT.md) (what has and has not been proven).

---

## 1. What the backend does

```
browser form (Next.js static export)
      │  POST /api/submit.php?form=contact   (multipart, files[] for attachments)
      ▼
IIS ──► PHP 8  submit.php
              ├─ origin check ............ only the site's own origins may post
              ├─ bot traps .............. hidden field + "faster than typing"
              ├─ size check ............. reports a size problem, not "missing fields"
              ├─ rate limit ............. per client and per day, file-backed
              ├─ validation ............. the server is the authority
              ├─ mail-mode gate ......... refuses unless the mode is authorised
              └─ AeroMailer ───────────► SMTP (authenticated, STARTTLS or implicit TLS)
                                            │
                                            ├─► notification  → the company inbox
                                            └─► acknowledgement → the enquirer
```

One endpoint serves both public forms: `?form=contact` and `?form=support`.
`api/health.php?token=…` reports configuration and can probe the mailbox.

### The files

| File | Responsibility |
|---|---|
| `api/submit.php` | The endpoint: guards, validation, delivery, response |
| `api/health.php` | Token-gated diagnostics; never sends mail |
| `api/lib/config.php` | Configuration loader and safe defaults. **No credentials.** |
| `api/lib/mailmode.php` | Decides who may receive mail, and refuses when not authorised |
| `api/lib/mailer.php` | Dependency-free SMTP client and MIME builder |
| `api/lib/forms.php` | Field contracts and the two email templates |
| `api/lib/guard.php` | Origin check, rate limiter, logging, secret masking |
| `api/lib/request.php` | Reads the submission; recognises an oversized body |
| `api/lib/uploads.php` | Attachments, trusted only after `finfo` inspects the contents |
| `web.config` | IIS rules: preserve the endpoint's JSON, hide the private paths |

---

## 2. Requirements

| Requirement | Detail |
|---|---|
| PHP | **8.0 or newer.** Verified on 8.4.26. The code uses `match`, named arguments and `str_contains`. Confirm the host's version at `api/health.php?token=…` — it is reported as `endpoint.php`. |
| Extensions | `openssl` (**required** — without it TLS to the mailbox is impossible), `fileinfo` (attachment typing), `mbstring` (length checks), `json` |
| Outbound network | TCP to the mailbox provider's submission port (usually 587 or 465). Some shared hosts block outbound SMTP; the health probe is how you find out. |
| Write access | `api/data/` and `api/logs/`. The endpoint creates them, with their own `.htaccess`, on first use. If it cannot, rate limiting is skipped and reference numbers fall back to random. |
| IIS | The supplied `web.config`. `existingResponse="PassThrough"` is **load-bearing**: without it IIS replaces the endpoint's JSON with its own error page and the form shows the visitor a generic failure no matter what actually went wrong. |

---

## 3. Credentials

The mailbox password is **never** uploaded. It is typed on the server, in one of
three places. All three were tested end to end; the difference is where the
password ends up.

| Where | How | Password on disk? |
|---|---|---|
| **1. `aero-config.php` beside `httpdocs`** (recommended) | Copy `api/config.production.example.php` to the folder that *contains* `httpdocs`, naming it `aero-config.php` | No — outside the web root, unreachable by any URL |
| **2. Plesk environment variables** | *Websites & Domains → your site → PHP Settings → Additional environment variables*: `AERO_SMTP_USER`, `AERO_SMTP_PASS` | No — nothing is written to disk |
| **3. `httpdocs/api/config.php`** | Copy the template there | Yes — inside the served folder, though denied by `web.config`, `.htaccess` and a PHP guard |

From `httpdocs/api/lib/config.php` the loader looks for:

1. `AERO_CONFIG_FILE`, if that environment variable is set
2. `httpdocs/api/config.php`
3. `../aero-config.php` relative to the site root — i.e. the folder containing `httpdocs`

Environment variables override the file.

### The settings that must be confirmed with the mailbox provider

These are **not** guessed, and the endpoint refuses to send until they are set.
They ship **blank**, not as placeholders: a placeholder reads as a value, so the
endpoint would try to connect to a host called `CONFIRM-WITH-PROVIDER` and
report *"cannot reach the mail server"* for what is really an unset key. A blank
is caught by the mail-mode gate instead, which names the missing key in
`health.php`. Fill these in from
[SMTP_CONFIGURATION_CHECKLIST.md](SMTP_CONFIGURATION_CHECKLIST.md) §2 — and
**do not reuse the password that was previously shared in chat**.

| Setting | Value |
|---|---|
| `smtp_host` | The provider's submission host |
| `smtp_port` | Usually `587` (STARTTLS) or `465` (implicit TLS) |
| `smtp_secure` | `tls` for STARTTLS, `ssl` for implicit TLS. Blank with 587 resolves to `tls`, with 465 to `ssl`; any other port with no encryption is refused |
| `smtp_user` | The mailbox account. May be a full address |
| `smtp_pass` | Its password — or an **application password** if the provider issues those |

> **Ask before assuming.** A provider that issues application passwords will
> reject the normal login password, and the failure looks identical to a wrong
> password. Also worth checking, by whoever owns the DNS: SPF, DKIM and DMARC
> for the sending domain. Without them, delivered mail is likely to be filtered.

The environment-variable spelling is `AERO_SMTP_ENCRYPTION` for the `smtp_secure`
key, `AERO_MAIL_TO` for `to_email`, `AERO_MAIL_FROM` for `from_email`, and
`AERO_<KEY>` in capitals for everything else. `api/config.example.php` is the
full reference.

---

## 4. The two delivery states, and the approval between them

The endpoint's behaviour is decided by `mail_mode`. This is the mechanism that
keeps a half-finished setup from emailing real customers.

| Mode | Delivers to | Gate |
|---|---|---|
| `local` | A local SMTP capture server. Recipient must be at a reserved test domain (`.test`, `.invalid`, `.example`, `example.com`) and the SMTP host must be on loopback | None — but it cannot reach a person by construction |
| `sample` | The reviewer (`mail_sample_inbox`, default `jeinfonet@gmail.com`) | `mail_sample_approved` must be `true` |
| `production` | The company inbox (`mail_production_inbox`, default `export@aerocotton.in`) and a confirmation to the enquirer | `mail_production_approved` must be `true` **and** host, user, password and sender must all be valid |

In both demo states the notification *and* the acknowledgement go to the one
inbox, so a reviewer sees the whole exchange. Every demo message carries a
banner naming what it is, and a `[SAMPLE FOR REVIEW]` or `[LOCAL CAPTURE]`
subject prefix. Only `production` mail has neither.

Approval is never inferred — not from a successful SMTP login, and not from
having just sent a sample. The only thing that authorises live delivery is the
operator editing the configuration.

### Step 1 — send the sample for review

In `aero-config.php`:

```php
'mail_mode'            => 'sample',
'mail_sample_approved' => true,
'mail_sample_inbox'    => 'jeinfonet@gmail.com',
'mail_sample_from'     => 'admin@aerocotton.in',
'smtp_host'            => '<confirmed with the provider>',
'smtp_port'            => 587,
'smtp_secure'          => 'tls',
'smtp_user'            => '<the sending mailbox>',
'smtp_pass'            => '<its password or app password>',
```

Then check the gate before anything is sent:

```
https://aerocotton.in/api/health.php?token=<health_token>
```

`report.mail.delivery_enabled` must be `true` and `problems` empty. Then send
the review copy — either submit the form yourself, or:

```
node scripts/send-sample-enquiry.mjs --url https://aerocotton.in
```

The reviewer receives a clearly-marked sample. **Nothing is live yet**: the
company inbox is still not receiving enquiries.

### Step 2 — after the client approves

Two edits, and only then:

```php
'mail_mode'                 => 'production',
'mail_production_approved'  => true,
```

Deploy the edited `aero-config.php`, then confirm the switch:

```
https://aerocotton.in/api/health.php?token=<health_token>
```

`report.mail.mode` must read `production`, `delivery_enabled` must be `true`,
and `warnings` must be empty. Submit one real test enquiry through the live
form in production mode and confirm it arrives in `export@aerocotton.in`.

### Rolling back

Set `mail_mode` back to `sample` and `mail_production_approved` to `false`.
Delivery stops immediately; nothing else changes. To stop it sending anything at
all, set `mail_mode` to `local` — the gate will then refuse every submission
with an honest message to the visitor and a reason in the log.

---

## 5. Deployment

Full file list: [DEPLOYMENT_MANIFEST.md](DEPLOYMENT_MANIFEST.md).
The package is built with `npm run pack:api` and is staged in `api-package/`.

```
1. Back up, from httpdocs/:
     web.config        (copy it to web.config.backup-<date>, and read it)
     api/submit.php  api/health.php  api/.htaccess
     api/config.example.php
     api/lib/  (the whole folder)

2. Merge web.config — do NOT overwrite it blind.
     The live copy cannot be read from outside (production answers every missing
     path with 404.html), so its contents are unknown until you open it. If it
     carries a <handlers> (PHP mapping) or <rewrite> section that the package's
     file does not, paste that section back in under <system.webServer> after
     uploading. Full procedure: DEPLOYMENT_MANIFEST.md §3 item 1.

3. Upload the CONTENTS of the archive into httpdocs/ — not into a new folder,
   so that httpdocs/api/submit.php is replaced and httpdocs/web.config is
   replaced.

4. Put the credentials in place (§3), including a new health_token. Do not
   upload them.

5. Verify:
     https://aerocotton.in/api/health.php?token=<health_token>
   Until health_token is set, that URL answers 404 for everyone. That is the
   page failing closed, not a fault.
```

**Do not re-upload `out/`.** It is the site that is already live. The backend
package exists precisely so the backend can be updated without touching it.

### What this change fixes

Previously every failure reached the visitor as the same meaningless sentence —
*"The enquiry service is not responding from this address"* — because IIS
replaced PHP's JSON with a stock HTML error page, so the browser's `JSON.parse`
failed. Two files carry that fix: `web.config` and, for the message itself,
`api/submit.php`.

---

## 6. Post-deployment verification

Run these in order. Each is read-only unless marked.

| # | Check | Expected |
|---|---|---|
| 1 | `GET https://aerocotton.in/definitely-missing` | **404** with the branded page. If it returns 200, the old `web.config` is still in place |
| 2 | `GET https://aerocotton.in/api/submit.php` | **405** with JSON (`application/json`). Anything HTML means IIS is still replacing the body |
| 3 | `GET https://aerocotton.in/api/lib/config.php` | **404**, and no configuration in the body |
| 4 | `GET https://aerocotton.in/api/data/rate-global.json` · `api/logs/submissions.log` | **404** for both. On IIS these were publicly readable before this change |
| 5 | `GET https://aerocotton.in/api/health.php` (no token) | **404** — the page hides itself |
| 6 | `GET …/api/health.php?token=<token>` | `problems: []`, `report.mail.mode` as intended, `checks.inbox_delivery.ok: null` |
| 7 | `GET …/api/health.php?token=<token>&probe=1` | `probe.ok: true`, `stopped_at: "authenticated"`. Sends **nothing** |
| 8 | Submit the form with an empty name | **422** with a per-field message the form highlights |
| 9 | Submit a valid enquiry | Success with a reference `AH-YYYY-NNNNNN` |
| 10 | Check `export@aerocotton.in` | The notification, with the reference in the subject and body *(production mode only)* |
| 11 | Reply to it | The reply goes to the enquirer, not to the website mailbox |
| 12 | Check the enquirer's inbox | The acknowledgement, quoting the same reference |

Checks 8 and 9 need a real submission. 10–12 are the only steps that prove
*delivery*; the endpoint can only confirm SMTP **acceptance**.

---

## 7. Operating notes

**Logs and data.** `api/logs/submissions.log` is JSON-lines, one entry per event:
`sent`, `delivery_failed`, `mail_mode_blocked`, `rate_limited`, `bot_discarded`,
`bad_request`, `confirmation_failed`. Failed deliveries are recorded in full —
including the submission — so a mail problem never loses an enquiry. Names,
addresses and message bodies are in there: it is not a public file, and on IIS
it is blocked by `web.config` and has no MIME map.

**Reference numbers.** `api/data/counter-<year>.txt`, incremented under a lock.
If `api/data/` is not writable the endpoint generates a random one instead. Both
are logged; only the sequential kind is continuous.

**Rate limiting.** `api/data/rate-*.json`, sliding window, per client and per
day: `5` submissions per `600` seconds and `60` per day by default. Adjust with
`rate_limit_max`, `rate_limit_window`, `daily_limit`.

**Trusted proxies.** `aero_client_ip()` reads `CF-Connecting-IP`,
`X-Forwarded-For` and `X-Real-IP` before `REMOTE_ADDR`. Behind Cloudflare, that
is correct; **without** a proxy in front, a client can forge those headers and
escape the rate limiter. If the site is not behind Cloudflare or a load
balancer, edit `aero_client_ip()` to use only `REMOTE_ADDR`.

**If the form starts failing.** `api/health.php?token=…` first: it names the
missing setting. Then `submissions.log` — a `delivery_failed` entry carries the
SMTP conversation with credentials masked, which is what a support call needs.
A `mail_mode_blocked` entry means the configuration, not the network.

**Attachments.** Enabled: `allow_uploads` is `true`, with 4 MB per file, 3
files and 6 MB in total. Acceptable types are decided by `finfo` on the file's
contents, not by its name or the type the browser claimed — a PHP script renamed
to `.pdf` is dropped. PHP's own `upload_max_filesize` and `post_max_size` cap
this lower if they are smaller; both are reported by `health.php` under
`uploads`. Messages above roughly 10 MB are often refused by shared-hosting
outbound mail limits, so raise these only if the host allows it.

---

## 8. What is not proven

Stated plainly, because it matters more than the parts that are:

- **Live delivery has not been tested.** No credential for the real mailbox has
  been available, so no mail has been sent to `export@aerocotton.in` or
  `jeinfonet@gmail.com` outside the local capture server.
- **The provider is not identified.** The shipped default is blank on purpose.
  `mail.aerocotton.in` was once assumed and does not resolve; the domain's MX
  records point at Google Workspace. Whoever administers the mailbox must
  confirm the host, port, encryption and authentication method.
- **The host's PHP version and extensions are unread.** Verified locally on
  8.4.26; the production host has not been queried.
- **`existingResponse="PassThrough"` has not been run against a real IIS.** No
  IIS was available. The file is valid XML and the semantics are documented, but
  check #2 in §6 is what actually confirms it.
- **Outbound SMTP from the host is unverified.** Some shared hosts block it. The
  probe in check #7 is the test.
