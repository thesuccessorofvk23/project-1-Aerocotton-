# Aerocotton contact form — diagnostic report

**Date:** 12 October 2026
**Target:** `https://aerocotton.in` — contact / support forms, `/api/submit.php`
**Hosting:** BigRock · Plesk on Windows · IIS 10
**Mode:** Investigation only. No file was modified, nothing was deployed, no DNS or hosting setting was changed, and no real email was sent. The protected export `out/` was read only, never written.

---

## 1. Executive summary

The contact form's message — *"Your request was not sent. The enquiry service is not responding from this address. Please try again in a moment."* — is **not** a description of a network outage, and it is not produced by PHP.

That exact string is printed by the frontend when a response **arrives but its body is not JSON** ([src/lib/forms/submit.ts:128-140](src/lib/forms/submit.ts#L128-L140)). Production is running a `web.config` whose `<httpErrors>` uses IIS's default `existingResponse="Replace"`, so **IIS throws away the JSON body of every non-2xx response and substitutes its own HTML error page**. The browser then fails `JSON.parse`, and prints the generic message.

This was proven live today, independently of any SMTP question:

| Probe against production | PHP's own response | What the client actually received |
|---|---|---|
| `GET /api/submit.php` | 405, `Allow: POST, OPTIONS`, `application/json` | **405 with `Content-Type: text/html` and IIS's "405 – HTTP verb used to access this page is not allowed" page (1293 bytes)** |
| `POST /api/submit.php?form=nonsense` | 400 with a JSON `{"ok":false,...}` body | **400 with `Content-Type: text/html`, body = the 11 bytes `Bad Request`** |

The `Allow: POST, OPTIONS` header is decisive: that is the exact value [public/api/submit.php:47](public/api/submit.php#L47) sends, and IIS's *own* 405 sends `Allow: OPTIONS, TRACE, GET, HEAD, POST` (observed on the `OPTIONS` probe). **PHP ran, produced JSON, and IIS discarded it.**

The corrected `web.config` (`existingResponse="PassThrough"`) exists in this working tree and is in the deployment package, but it **is not on the server**.

Two consequences that matter more than the wording of the message:

1. Because IIS replaces the body of **every** non-2xx response, the deployed site makes **all** failure modes — 422 validation, 429 rate limit, 403 origin, 502 delivery failure, 503 misconfiguration — look identical to the visitor. The specific failure a visitor hit **cannot be determined from the message**, and it cannot be determined from outside the server.
2. The upstream reason a submission fails *at all* is most likely mail delivery, but that is **not proven here** (§12). The shipped backend defaults point `smtp_host` at a host that does not resolve, with an empty `smtp_user` and `smtp_pass`; that would produce a 502, which IIS then hides.

Separately, the deployed server turns every 404 into **HTTP 200** with the exported 404 page (`responseMode="ExecuteURL"` semantics), confirmed live: `/api/this-path-does-not-exist-xyz123` → `200` + 22251 bytes of 404.html.

**What is solid:** PHP executes in production; the backend returns correct, valid, uncacheable JSON for every status; the protected export is byte-identical to its pin; the local suite (30 tests, real PHP + real SMTP capture) passes.
**What is not:** which failure the visitor actually hit, and whether the mailbox can authenticate at all.

| Check | Result | Evidence | Confidence |
|---|---|---|---|
| Frontend endpoint URL | `/api/submit.php`, default (no env override baked in) | Found verbatim in the deployed chunk `/_next/static/chunks/0y_sfsshbdg6d.js` | Confirmed |
| PHP endpoint exists | Yes — `https://aerocotton.in/api/submit.php` answers | Live `GET` → 405 with PHP's `Allow` and `Cache-Control: no-store` | Confirmed |
| PHP executes locally | Yes | `php -S` over a copy of `out/api`: 405/400/422/404 all correct JSON | Confirmed |
| PHP executes in production | Yes | PHP's own `Allow`, `Cache-Control`, `X-Content-Type-Options` present on the 405 | Confirmed |
| JSON response preserved | **No — on production only** | 405 → `text/html` IIS page; 400 → `Bad Request` | Confirmed |
| SMTP configuration complete | **No** in the shipped export | `smtp_user` EMPTY, `smtp_pass` EMPTY, `health_token` EMPTY (comments stripped) | Confirmed |
| SMTP hostname verified | **Fails to resolve** — `mail.aerocotton.in` | `nslookup`/`getent`: no A record; only `aerocotton.in` (216.10.253.21) resolves | Confirmed |
| SMTP connectivity | **Blocked** | Requires the server's own config and an authorized probe | Blocked |
| SMTP authentication | **Blocked** | No credentials present or accessible | Blocked |
| Message submission | **Blocked** | Would require sending real mail | Blocked |
| Actual inbox delivery | **Not tested** | Would send a real email | Blocked |
| Protected index unchanged | **Yes** | `npm test` export pin: 542 files, every SHA-256 identical, 3/3 pass | Confirmed |

---

## 2. Current failure

```
"Your request was not sent. The enquiry service is not responding from this address.
 Please try again in a moment."
```

The string exists in the deployed bundle (`/_next/static/chunks/0y_sfsshbdg6d.js`), so the visitor is running the current frontend. Only one code path produces it — see §4. It is emitted **only** when the HTTP request succeeded at the transport level but the body could not be parsed as JSON.

---

## 3. Repository and directory structure

**Project root:** `/e/Aerocotton` (branch `main`, 89 commits, 2 human contributors)

**Frontend:** Next.js `16.3.4` + React `19.3.0`, `output: "export"` (static export), Tailwind 4, zod 4.
**Backend:** hand-written PHP (no Composer, no third-party PHP packages). The SMTP client is written directly on `stream_socket_client`.

### 3.1 Relevant tree

```
aerocotton/
├── public/                          ← copied verbatim into out/ by `next build`
│   ├── web.config                   IIS rules              (UNTRACKED, modified today)
│   ├── .htaccess                    Apache twin            (UNTRACKED)
│   └── api/
│       ├── submit.php               the endpoint           (TRACKED)
│       ├── health.php               token-gated diagnostics(TRACKED)
│       ├── .htaccess                hides lib/data/logs     (TRACKED)
│       ├── config.example.php       reference only          (TRACKED)
│       ├── config.local.example.php local-demo template     (UNTRACKED)
│       ├── config.production.example.php production template(UNTRACKED)
│       ├── data/                    runtime counters        (GIT-IGNORED)
│       │   ├── .htaccess            (ships, denies the dir)
│       │   ├── counter-2026.txt     reference-number counter
│       │   └── rate-*.json          rate-limit counters
│       ├── logs/                    runtime logs            (GIT-IGNORED)
│       │   ├── .htaccess            (ships, denies the dir)
│       │   └── submissions.log      every submission, masked
│       └── lib/
│           ├── config.php           loader + safe defaults  (UNTRACKED — must ship)
│           ├── mailmode.php         delivery-state gate     (UNTRACKED — must ship)
│           ├── mailer.php           SMTP client + MIME      (TRACKED)
│           ├── guard.php            CORS/IP/rate/log/mask   (TRACKED)
│           ├── request.php          body reader, aero_json  (TRACKED)
│           ├── forms.php            validation + 2 templates(TRACKED)
│           ├── uploads.php          attachment intake       (TRACKED)
│           └── .htaccess            denies the library      (UNTRACKED)
├── out/                             THE DEPLOYED EXPORT — 542 files, git-ignored, read-only here
│   ├── index.html                   2026-10-09 07:52
│   ├── web.config                   2026-10-09 07:09 — PassThrough, but NO <security> block
│   └── api/…                        the backend as last built (see §3.3)
├── src/
│   ├── app/contact/page.tsx         contact page, mounts <EnquiryForm />
│   ├── components/forms/
│   │   ├── EnquiryForm.tsx          contact fields, honeypot, submit handler
│   │   ├── SupportForm.tsx          support fields
│   │   ├── use-submission.ts        idle/sending/success/error state machine
│   │   ├── FormReceipt.tsx          success / error rendering
│   │   ├── form-kit.tsx, TurnstileField.tsx
│   └── lib/forms/
│       ├── submit.ts                transport + the message under investigation
│       ├── schema.ts                client-side zod (fast answer, not authority)
│       └── options.ts               upload limits, selects
├── tests/
│   ├── api.test.mjs                 27 endpoint tests (real php -S + real Mailpit)
│   ├── export.test.mjs              3 pin tests over out/
│   ├── lib/harness.mjs, export-server.mjs
│   └── fixtures/protected-export.sha256   542 lines
├── scripts/
│   ├── pack-backend.mjs             builds the backend upload package
│   ├── pack-upload.mjs              builds the full-site zip (not used here)
│   ├── dev-mail-stack.mjs           starts/stops local Mailpit
│   ├── send-sample-enquiry.mjs      posts a sample through the running endpoint
│   ├── serve-export.mjs, clean-api-runtime-state.mjs, …
├── api-package/                     staged backend package (git-ignored)
├── aerocotton-api-upload.zip        the backend package (git-ignored)
├── DEPLOY.md, DEPLOYMENT_MANIFEST.md, PRODUCTION_HANDOVER.md,
│   TEST_REPORT.md, SMTP_AUDIT_REPORT.md, README.md
└── AEROCOTTON_CONTACT_FORM_DIAGNOSTIC_REPORT.md   ← this file
```

### 3.2 File-by-file

| Path | Purpose | Exists | Git | In export | Required in production |
|---|---|---|---|---|---|
| `src/lib/forms/submit.ts` | builds `FormData`, `POST /api/submit.php?form=…`, parses JSON | yes | tracked | compiled into a JS chunk | yes |
| `src/components/forms/use-submission.ts` | form state machine | yes | tracked | compiled | yes |
| `src/app/contact/page.tsx` | contact page | yes | tracked | `contact/index.html` | yes |
| `public/api/submit.php` | the endpoint | yes | tracked | yes | **yes** |
| `public/api/health.php` | token-gated diagnostics | yes | tracked | yes | yes (optional) |
| `public/api/lib/config.php` | config loader + safe defaults | yes | **untracked** | yes | **yes — no loader, no endpoint** |
| `public/api/lib/mailmode.php` | who may receive mail for the active mode | yes | **untracked** | **no** | **yes — `submit.php` requires it** |
| `public/api/lib/mailer.php` | SMTP client, MIME builder, `probe()` | yes | tracked | yes | yes |
| `public/api/lib/guard.php` | CORS, IP, rate limit, references, log, secret masking | yes | tracked | yes | yes |
| `public/api/lib/request.php` | `aero_json()` / `aero_fail()`, body reading | yes | tracked | yes | yes |
| `public/api/lib/forms.php` | field contracts + the two email templates | yes | tracked | yes | yes |
| `public/api/lib/uploads.php` | attachment intake, `finfo` sniffing | yes | tracked | yes | yes |
| `public/web.config` | IIS rules | yes | **untracked** | yes | **yes — this is the fix** |
| `public/.htaccess` | Apache twin | yes | **untracked** | yes | yes (Apache hosts) |
| `public/api/.htaccess`, `public/api/lib/.htaccess` | deny `lib/`, `data/`, `logs/`, config | yes | tracked | yes | yes on Apache; `web.config` is authoritative on IIS |
| `public/api/config.php` | **credentials** — operator's file | **absent locally** | ignored | no | yes, typed on the server |
| `public/api/data/`, `public/api/logs/` | runtime state | yes (test residue) | ignored | `.htaccess` only | created by the host |
| `out/` | the deployed export | yes | ignored | — | already live |

### 3.3 Source vs the existing export

`out/` was **not** modified. Comparing `public/` against it, byte for byte:

| File | State |
|---|---|
| `web.config` | **DIFFERS** — export has `PassThrough` but **no `<security><requestFiltering>` block** (0 vs 3 `hiddenSegments` lines) |
| `api/submit.php` | **DIFFERS** — export predates the mail-mode gate |
| `api/health.php` | **DIFFERS** — export predates the mode/probe report |
| `api/lib/config.php` | **DIFFERS** — export has no `env`/`mail_mode` keys at all |
| `api/lib/mailer.php` | **DIFFERS** — export is 3 days older than source |
| `api/lib/request.php` | **DIFFERS** — export lacks the `post_max_size` check |
| `api/.htaccess`, `api/config.example.php` | **DIFFERS** |
| `api/lib/mailmode.php` | **MISSING from the export** (the export's `submit.php` does not `require` it, so the export is internally consistent — but it is the pre-fix backend) |
| `api/config.local.example.php`, `api/config.production.example.php` | missing from the export |
| `api/lib/forms.php`, `guard.php`, `uploads.php`, all `.htaccess`, root `.htaccess` | identical |

Everything the visitor's browser loads comes from `out/`; only the backend differs, and the backend was **never rebuilt after the source fixes**. That is expected and correct given the instruction to leave the export alone — but it means the fix cannot ship by rebuilding `out/`. It ships as the separate backend package (§14).

---

## 4. Frontend submission flow

| | |
|---|---|
| Component that shows the message | [FormReceipt.tsx](src/components/forms/FormReceipt.tsx), driven by [use-submission.ts](src/components/forms/use-submission.ts) |
| State machine | `idle → sending → success | error` |
| Request URL | `` `${FORMS_ENDPOINT}?form=${form}` `` |
| Endpoint constant | [submit.ts:36](src/lib/forms/submit.ts#L36) — `process.env.NEXT_PUBLIC_FORMS_ENDPOINT?.trim() \|\| "/api/submit.php"` |
| Method | `POST` |
| Content type | `multipart/form-data` (browser-set boundary) — `FormData` with the field values, `elapsed`, and `files[]` |
| Cookies / custom headers | **none** — no credentials mode, no `Authorization`, no CSRF token, no preflight |
| Expected response | JSON, any status |
| Success | `payload.ok === true` |
| Failure | `payload.ok === false` → uses `payload.message`, `payload.errors`; `retryable` is false for 400/403/422 |
| Timeout | 60 s via `AbortController` |

### 4.1 The exact trigger

```ts
// src/lib/forms/submit.ts:126-141
  // A static host will happily serve the endpoint's source back as a file
  // rather than running it. Treating that as an unreachable endpoint keeps the
  // visitor from ever seeing a success we cannot stand behind.
  const raw = await response.text();
  let payload: unknown = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      message:
        "The enquiry service is not responding from this address. Please try again in a moment.",
      errors: {},
      retryable: false,
      unreachable: true,
    };
  }
```

That `catch` is the **only** producer of the string.

### 4.2 Which conditions produce it

| Condition | Produces this message? | Evidence |
|---|---|---|
| Network failure / DNS / offline | **No** — different message ("We could not reach the server…") | [submit.ts:96-108](src/lib/forms/submit.ts#L96-L108) |
| 60 s timeout / abort | **No** — same network branch | `AbortController` above |
| **Any non-2xx response, on production** | **Yes** | Live 405 → `text/html`; live 400 → `Bad Request` |
| A 2xx whose body is HTML (e.g. PHP served as a file) | **Yes** | same `catch`; not observed on production |
| A 2xx JSON body with unexpected shape | **No** — "We could not read the server's reply" | [submit.ts:143-151](src/lib/forms/submit.ts#L143-L151) |
| PHP warning/notice leaked into the body before the JSON | **Yes (possible, not observed)** | `display_errors=0` is set in `submit.php`; local runs produced clean bodies |

**Conclusion for §2:** the message is caused by **an HTML response where JSON was expected**, on production only. It is *not* a network failure. The HTTP status that accompanied it is unknowable from outside, because IIS destroyed it along with the body.

---

## 5. PHP endpoint audit

### 5.1 Endpoints

| | |
|---|---|
| Production URL | `https://aerocotton.in/api/submit.php` |
| Local URL used by the suite | `http://127.0.0.1:<ephemeral>/submit.php` over `php -S` |
| Source path | [public/api/submit.php](public/api/submit.php) |
| Export path | `out/api/submit.php` |
| Depends on files outside `public/`? | **No** — everything is under `public/api/`; runtime state is `public/api/data` and `public/api/logs` |

### 5.2 Order of checks in `submit.php`

`method → CORS/origin → body parse → form name → honeypot + elapsed → Turnstile → rate limit → validation → uploads → mail-mode gate → build → SMTP → acknowledgement → 200`

Two properties matter for this investigation:

- the **form-name 400 and the method 405 happen before the rate limiter**, so probing them writes no state on production (that is why those probes were considered safe);
- the **mail-mode gate and the SMTP send happen last**, so any refusal there is a 502/503 — exactly the class of response IIS hides.

### 5.3 Response machinery — correct by construction

```php
// public/api/lib/request.php:22-32
function aero_json(int $status, array $payload): void
{
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, max-age=0');
        header('X-Content-Type-Options: nosniff');
    }
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

// public/api/lib/request.php:35-38
function aero_fail(int $status, string $message, array $extra = []): void
{
    aero_json($status, ['ok' => false, 'message' => $message] + $extra);
}
```

Every error path funnels through `aero_fail`, so **no PHP error path can produce a non-JSON body** — provided nothing is emitted before it, which `display_errors=0` and the local runs both support.

### 5.4 Local endpoint tests (executed, no email sent)

A throwaway copy of `out/api` served by `php -S 127.0.0.1:18971` (the real `out/` untouched; temp dir removed afterwards; PHP error log **0 bytes**):

| Request | Status | Content-Type | Body (sanitised) | Matches intent |
|---|---|---|---|---|
| `GET /submit.php` | 405 | `application/json` | `{"ok":false,"message":"This endpoint accepts POST requests only."}` | yes |
| `DELETE /submit.php` | 405 | `application/json` | same as above | yes |
| `OPTIONS /submit.php` | 204 | — | empty | yes |
| `POST` malformed JSON | 400 | `application/json` | `{"ok":false,"message":"We could not read that submission. Please try again."}` | yes |
| `POST {"form":"nope"}` | 400 | `application/json` | `{"ok":false,"message":"We could not tell which form that was. Please reload the page and try again."}` | yes |
| `POST {"form":"contact"}` (no fields) | 422 | `application/json` | `{"ok":false,…,"errors":{"name":…,"company":…,"email":…,"country":…,"interest":…,"message":…}}` | yes |
| `GET /lib/mailer.php` | 404 | `text/html` | empty | yes — refuses to run standalone |
| `GET /health.php` (no token) | 404 | `text/plain` | `Not Found` | yes — hides itself |

**The backend is correct.** Not one of these responses could make a browser print "the enquiry service is not responding". The same requests against production return IIS HTML (§8).

### 5.5 Production endpoint behaviour (read-only, no state written)

| Request | Status | Content-Type | Body |
|---|---|---|---|
| `GET /api/submit.php` | 405 | **`text/html`** | IIS 405 page, 1293 bytes; PHP's `Allow: POST, OPTIONS` and `Cache-Control: no-store` survive in the headers |
| `POST ?form=nonsense` | 400 | **`text/html`** | `Bad Request` (11 bytes) |
| `OPTIONS /api/submit.php` | 200 | — | empty; `Allow: OPTIONS, TRACE, GET, HEAD, POST` — **IIS answered this, not PHP** |

`OPTIONS` is informational only: the form's `FormData` POST is same-origin, so the browser never sends a preflight. If a cross-origin deployment were ever attempted, IIS would answer the preflight itself and CORS would fail.

---

## 6. SMTP configuration audit

Values were read by stripping PHP comments with `token_get_all` first — the loader's doc-block contains a worked example that would otherwise be mistaken for real configuration.

### 6.1 Shipped export defaults — `out/api/lib/config.php` (what production most likely runs)

| Key | State | Source |
|---|---|---|
| `env` | **key absent** | the loader predates the concept |
| `mail_mode` | **key absent** | the loader predates the concept |
| `smtp_host` | **present, non-empty (18 chars)** — `mail.aerocotton.in` | hardcoded default |
| `smtp_port` | `587` | hardcoded default |
| `smtp_secure` | `tls` (3 chars) | hardcoded default |
| `smtp_user` | **EMPTY** | hardcoded default |
| `smtp_pass` | **EMPTY** | hardcoded default |
| `from_email` | EMPTY (falls back to `smtp_user`, which is also empty) | |
| `to_email` | email address (`enquiries@aerocotton.in`) | hardcoded default |
| `health_token` | **EMPTY** | `/api/health.php` is therefore a 404 |
| `turnstile_secret` | EMPTY | CAPTCHA disabled |
| `allowed_origins` | array, includes `https://aerocotton.in` | |
| `mail_production_inbox`, `mail_sample_inbox` | key absent | |

### 6.2 Current source defaults — `public/api/lib/config.php`

| Key | State |
|---|---|
| `env` | `development` |
| `mail_mode` | `local` |
| `smtp_host`, `smtp_secure`, `smtp_user`, `smtp_pass`, `from_email`, `to_email`, `health_token`, `turnstile_secret` | **all EMPTY** |
| `smtp_port` | `0` (resolves to 1025 plain in `local` mode) |
| `mail_production_inbox` / `mail_sample_inbox` | email addresses |
| `mail_sample_approved` / `mail_production_approved` | `false` |

The current loader deliberately blanks the host: [public/api/lib/config.php:134-140](public/api/lib/config.php#L134-L140) and its header comment state that a plausible-looking guess is worse than a blank the operator must fill in, and `lib/mailmode.php` refuses to send until they are.

### 6.3 Classification

| Value | Classification |
|---|---|
| `mail.aerocotton.in`, 587, tls | **Hardcoded in the shipped source**, unverified against any provider |
| `smtp_user` / `smtp_pass` | **Empty in the export.** Whether the *server's* copy is filled in is **not accessible** |
| `export@aerocotton.in` | Intended production recipient — supplied by the owner, **not confirmed on the server** |
| `admin@aerocotton.in` | Supplied sender account — **not confirmed**, and not assumed correct |
| Production `mail_mode`, approval flags, `to_email` | **Unknown** — no readable configuration, no health token |

### 6.4 Credentials

**No password is present in any file inspected.** The only non-empty `smtp_pass` occurrence in the export is inside the loader's documentation comment. Nothing was printed, and nothing is in this report.

### 6.5 Transport requirements

- Hand-written SMTP — **no Composer, no PHP mail library**.
- Extensions: `openssl` (TLS), `mbstring`, `fileinfo` (attachment sniffing), `json`. `health.php` reports all four.
- Mechanism: `AUTH LOGIN` or `AUTH PLAIN` — [mailer.php:209](public/api/lib/mailer.php#L209), [mailer.php:215](public/api/lib/mailer.php#L215).
- Precedence in the current loader: `AERO_*` environment variables → config file (`AERO_CONFIG_FILE`, then `public/api/config.php`, then `aero-config.php` above the web root) → built-in defaults.

---

## 7. SMTP transport and delivery analysis

The mailer uses **SMTP over `stream_socket_client`** — not `mail()`, not an API SDK.

```php
// public/api/lib/mailer.php
$this->command('STARTTLS', [220]);
$ok = @stream_socket_enable_crypto($this->fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
…
$this->command('AUTH LOGIN', [334]);
$this->command('AUTH PLAIN ' . base64_encode("\0" . $user . "\0" . $pass), [235, 503], 'AUTH PLAIN ***');
…
$this->command('MAIL FROM:<' . $from . '>', [250]);
$this->command('RCPT TO:<' . $to . '>', [250, 251]);
```

### 7.1 Stage status

| Stage | Production | Local (suite) |
|---|---|---|
| 1. Hostname resolution | **Verified FAILS** for the shipped default — `mail.aerocotton.in` has no A record at the local resolver or 8.8.8.8 | n/a (loopback) |
| 2. TCP connection | **Not tested** | verified: failure → 502, `delivery_failed` logged |
| 3. TLS negotiation | **Not tested** | verified by the suite's happy path |
| 4. Authentication | **Not tested — blocked** (no credentials) | verified: a `535` rejection → 502, password masked in the log |
| 5. Sender/recipient acceptance | **Not tested** | verified |
| 6. Message submission | **Not tested** | verified, read back out of Mailpit |
| 7. SMTP server response | **Not tested** | verified (transcript captured, secrets masked) |
| 8. Application response | **Cannot be observed** — IIS replaces it | verified: 200 with `reference`, `mailMode`, `submittedAt` |

### 7.2 DNS (read-only, performed today)

| Query | Result |
|---|---|
| `A mail.aerocotton.in` | **no record** |
| `A smtp.aerocotton.in` | **no record** |
| `A aerocotton.in` | 216.10.253.21 |
| `MX aerocotton.in` | `aspmx.l.google.com` (p1), `alt1/alt2` (p5), `alt3/alt4` (p10) — **Google Workspace** |
| `TXT _dmarc.aerocotton.in` | **Non-existent domain** |
| `TXT aerocotton.in` (SPF) | **Inconclusive** from this resolver — marked Unknown |

So the domain **receives** mail through Google Workspace, while the shipped backend is pointed at a BigRock-style host that does not exist. A BigRock mailbox would in any case be the wrong provider for this domain.

### 7.3 What this does and does not prove

It proves the shipped defaults cannot deliver: an unresolvable host with empty credentials. It does **not** prove that is the failure the visitor hit, because (a) the operator may have filled in `httpdocs/api/config.php` or `aero-config.php` on the server, which cannot be read from outside, and (b) even a confirmed mail failure would reach the visitor only as the same generic message.

---

## 8. IIS / Plesk compatibility

### 8.1 Live behaviour, 12 October 2026

```
GET /api/submit.php
  HTTP/1.1 405 Method Not Allowed
  Cache-Control: no-store, max-age=0          ← PHP (request.php:27)
  Allow: POST, OPTIONS                        ← PHP (submit.php:47)
  Content-Type: text/html                     ← IIS
  Server: Microsoft-IIS/10.0
  X-Powered-By: ASP.NET · X-Powered-By-Plesk: PleskWin
  1293 bytes of IIS's "405 – HTTP verb used to access this page is not allowed"
```

```
POST /api/submit.php?form=nonsense
  HTTP/1.1 400 Bad Request
  Content-Type: text/html
  11 bytes: Bad Request
```

```
/api/health.php                              → 200, text/html, 22251 bytes  (the exported 404 page)
/api/this-path-does-not-exist-xyz123         → 200, text/html, 22251 bytes  (the exported 404 page)
/api/lib/mailer.php                          → 200, text/html, 22251 bytes  (404 → soft-404: lib IS protected)
/api/config.php                              → 200, text/html, 22251 bytes  (404 → soft-404: credentials not readable)
/api/config.example.php                      → 200, text/html, charset=UTF-8, 0 bytes  (executed, produced no output)
/web.config                                  → 200, text/html, 22251 bytes  (not downloadable)
/                                            → 200, text/html, 48181 bytes
/contact/                                    → 200, text/html, 33260 bytes
```

The 22251-byte body is the exported 404 page (`<title>…</title>` plus "404 / Page not found"), served with **status 200**.

### 8.2 What this establishes

| Question | Answer |
|---|---|
| Is PHP executed at `/api/`? | **Yes** — proven by PHP's own headers on the 405, and by `config.example.php` returning an empty `text/html` body (a static file would return 4543 bytes of source) |
| Does IIS replace PHP's JSON? | **Yes** — `existingResponse="Replace"` semantics, confirmed for 405 and 400 |
| Does IIS rewrite 404s to 200? | **Yes** — `responseMode="ExecuteURL"` semantics, confirmed for missing paths and for the token-less health check |
| Is `api/lib/` protected? | **Yes, indirectly** — it 404s, then becomes the soft-404 page. Not a leak, but not a clean refusal either |
| Is the repo's `web.config` deployed? | **No** |

### 8.3 Source observation vs live behaviour

The **observation** that the repo's `web.config` fixes this is a source-level claim:

```xml
<!-- public/web.config:48-51 -->
<httpErrors errorMode="Custom" existingResponse="PassThrough">
  <remove statusCode="404" />
  <error statusCode="404" path="404.html" responseMode="File" />
</httpErrors>
```

with a `<security><requestFiltering><hiddenSegments>` block (3 occurrences of `hiddenSegments`) for `lib`, `data`, `logs`, `config*.php`, `aero-config.php`. It parses as valid XML, and `tests/api.test.mjs` case 12 asserts `PassThrough` and the absence of `ExecuteURL`.

The **live behaviour** is the opposite on both counts. The deployed file's exact text cannot be read — `/web.config` is blocked and comes back as the soft-404 page — so its content is **Unknown**; only its behaviour is established.

### 8.4 What access is missing

1. Read access to `httpdocs/web.config` on the server (or the Plesk IIS UI), to confirm `existingResponse` and the 404 `responseMode` before replacing it.
2. The site's PHP error log (Plesk → domains → Logs, or `error_log`).
3. A `health_token` to read `/api/health.php`.
4. Whether the operator placed `api/config.php` or `aero-config.php` on the server.

---

## 9. Security findings

| # | Finding | Severity | Status |
|---|---|---|---|
| S1 | **The deployed `web.config` hides every application error from the operator.** A 502 credential leak, a 503 misconfiguration and a 422 typo all present identically to users *and* to anyone watching. Debugging is impossible by design. | High | Confirmed live |
| S2 | **Soft-404: every missing path returns HTTP 200.** Search engines are told every dead URL is healthy, and monitoring cannot alert on 404s. | Medium | Confirmed live |
| S3 | `api/lib/` and `api/config.php` are protected only *indirectly* (they 404, then get the soft-404 page). The repo's `web.config` makes this deliberate with `hiddenSegments`. | Medium | Confirmed live; fix pending deployment |
| S4 | Runtime state (`data/rate-*.json`, `logs/submissions.log`) is git-ignored and denied by `.htaccess` in source; on IIS the `.htaccess` is inert, so `web.config` is the only real protection. | Medium | Confirmed by inspection |
| S5 | `health.php` is disabled (`health_token` EMPTY in the export, confirmed empty on production by the soft-404). Correct: it must not be live until a long random token is set. | Informational | Confirmed |
| S6 | No credential exists anywhere in the repository, the export, the package or the logs inspected. The packer additionally refuses to build if a filled-in password appears. | Informational | Confirmed |
| S7 | `submissions.log` contains enquirers' names, emails, phone numbers and message bodies (masked secrets, but real personal data). Local copy is 2881 bytes, 9 entries; no personal data was printed. | Informational | Confirmed by design |
| S8 | Four load-bearing files are **untracked in Git** (`public/web.config`, `public/.htaccess`, `public/api/lib/config.php`, `public/api/lib/mailmode.php`). A fresh clone silently loses the endpoint's loader, its delivery gate and the IIS fix. | Medium | Confirmed |

---

## 10. Tests actually executed

Nothing below is simulated. Every item was run in this session.

| # | Test | Command / request | Result |
|---|---|---|---|
| T1 | Full backend + export suite | `npm test` | **30/30 pass, 0 fail, exit 0, 8.7 s** |
| T2 | Endpoint behaviour over real HTTP | `php -S` on a copy of `out/api`, 8 curl probes | all 8 as intended (§5.4) |
| T3 | Local SMTP capture | part of T1 — Mailpit on loopback, message read back out of the inbox | pass |
| T4 | Production endpoint, read-only | `GET` / `POST ?form=nonsense` / `OPTIONS` | PHP runs; JSON destroyed by IIS |
| T5 | Production path protection | 8 read-only GETs | soft-404 (200 + 404.html) everywhere |
| T6 | Deployed bundle inspection | fetched `/contact/` and its 12 JS chunks | endpoint = `/api/submit.php`; the error string is present |
| T7 | DNS | `nslookup` / `getent` | `mail.aerocotton.in` does not resolve; MX = Google; DMARC absent |
| T8 | Config presence audit | PHP `token_get_all` comment-stripping, 13 keys × 2 files | §6 |
| T9 | Source vs export diff | `cmp` over every backend file | §3.3 |
| T10 | Protected export integrity | part of T1 — 542 files vs `tests/fixtures/protected-export.sha256` | pass; 3/3, no file added or removed |
| T11 | Package integrity | `api-package/` vs `public/` byte comparison | 15/15 identical |

**Blocked tests** (require credentials, hosting access, or would send real mail):

| Test | Why blocked |
|---|---|
| Production SMTP connectivity / authentication | Needs the server's own config and a `health_token` |
| `/api/health.php` on production | `health_token` is empty; with a wrong token it correctly returns the soft-404 |
| Reading production `submissions.log` / PHP error log | Not web-accessible (correctly) |
| A 2xx JSON round-trip on production | Would write a rate-limit counter and could trigger a send |
| End-to-end inbox delivery | Would send a real email |

---

## 11. Confirmed root causes

**F1 — IIS discards the endpoint's JSON. Severity: Critical. Explains the displayed message. Confidence: Confirmed.**
`<httpErrors existingResponse="Replace">` (IIS's default) replaces the entity body and content type of every non-2xx response. Evidence: live 405 carrying PHP's `Allow: POST, OPTIONS` with an IIS HTML body and `Content-Type: text/html`; live 400 whose body is `Bad Request`. Locally the same requests return correct JSON (§5.4), so the fault is entirely in the host configuration.
*Confirming test still outstanding:* replace `web.config` on the server and re-run the two probes in §5.5 — they must return `application/json`.

**F2 — The deployed `web.config` is not the one in this repository. Severity: Critical. Explains the current frontend error — it is the misconfiguration behind F1. Confidence: Confirmed.**
The repo's file has `existingResponse="PassThrough"`, `responseMode="File"` for 404, and the `<security>` block; the live behaviour is `Replace` + `ExecuteURL`. The deployed file cannot be downloaded (soft-404), so its text is unknown, but its behaviour is established.
*Outstanding:* obtain a copy of the server's `web.config` before replacing it.

**F3 — The shipped SMTP defaults cannot deliver mail. Severity: High. Explains why a submission fails at all, but not which failure the visitor saw. Confidence: Strongly Suspected.**
`smtp_host = mail.aerocotton.in` does not resolve; `smtp_user` and `smtp_pass` are empty; the domain's MX is Google Workspace; there is no DMARC record. This would produce a 502 — which, under F1, presents as the generic message. It is *suspected* rather than *confirmed* for production because the operator may have placed a different configuration on the server that cannot be read from outside.
*Confirming test:* `/api/health.php?token=…&probe=1` on the server, which reports the configured host, whether credentials are present, and where a connection attempt stops — **without sending mail**.

**F4 — Every failure mode is indistinguishable, including to the operator. Severity: High. Does not itself produce the message — it is why the message carries no information about what actually went wrong. Confidence: Confirmed.**
A direct consequence of F1: 422, 429, 403, 502 and 503 all reach the browser as one string. The evidence that would identify the visitor's specific failure was destroyed at the moment it was produced.

---

## 12. Suspected causes

| ID | Suspicion | Why it is not confirmed | What would confirm it |
|---|---|---|---|
| H1 | The visitor's submission failed at the mail-mode gate (503) or the SMTP send (502) | The production configuration is unreadable; a 200 path was never exercised | health probe on the server |
| H2 | The visitor was rate-limited (429) during repeated testing | Rate-limit counters on the server are unreadable | `submissions.log` on the server (contains `rate_limited` events, no credentials) |
| H3 | `smtp_user`/`smtp_pass` on the server are filled in but wrong | No access | health probe with `&probe=1` |
| H4 | SPF absent → accepted by SMTP but landed in spam | SPF lookup inconclusive from this resolver; inbox delivery was never tested | authoritative TXT lookup from a resolver that returns the record; then an authorised delivery test |
| H5 | A PHP warning preceded the JSON body | `display_errors=0` and local runs are clean; production PHP error log unread | the server's PHP error log |

**Explicitly not claimed:** SMTP is *not* established as the root cause of the displayed message. The displayed message is fully explained by F1 alone, and F1 is confirmed.

---

## 13. Missing evidence and access

1. **`httpdocs/web.config` as it is on the server** — the single most valuable artefact. Its text cannot be fetched; only its behaviour is known.
2. **A `health_token`** for `/api/health.php`, to read the configured mail mode, whether credentials are present, storage writability and PHP limits.
3. **The PHP error log** for the endpoint.
4. **`httpdocs/api/config.php` or `aero-config.php`** — whether they exist on the server, without their contents.
5. **Confirmation from the mailbox provider** of host, port, encryption and whether `admin@aerocotton.in` is a mailbox that may send as `aerocotton.in`.
6. **Authoritative SPF/DKIM/DMARC records** from a resolver that returns them.
7. **Whether the operator approved sample-mode sending** — the current design requires an explicit, recorded approval before any real delivery.

---

## 14. Recommended repair plan

**Not implemented — investigation only.** Ordered by dependency.

### A. Production deployment (owner-approval required; no code change)

1. **Back up** `httpdocs/web.config`, `httpdocs/api/submit.php`, `httpdocs/api/health.php`, `httpdocs/api/.htaccess`, `httpdocs/api/lib/`.
2. **Upload the corrected `web.config`** — this alone removes F1, F2 and F4 and makes every later failure readable. Already staged in `aerocotton-api-upload.zip` (§15).
3. **Verify** the two probes in §5.5 now return `application/json`.
4. **Run `/api/health.php?token=…&probe=1`** and record the result. This answers F3 without sending mail.

### B. Email-provider configuration (owner + provider; no code change)

5. Confirm host/port/encryption for a mailbox on the domain's **Google Workspace**, not a BigRock host.
6. Decide the sender: `admin@aerocotton.in` only if the provider permits sending as the domain; otherwise the mailbox Google's DKIM covers.
7. Create the DNS records (SPF, DKIM, DMARC). **Explicitly requires the owner's authorisation — not part of any change here.**
8. Set `mail_mode` to `sample` with `mail_sample_approved` for the first review, then `production` with `mail_production_approved`. Editing that file *is* the recorded approval.

### C. Source-code changes (none required for the reported bug)

The backend and frontend are correct; nothing in them caused this. Two hardening items only:

9. **Track the four untracked load-bearing files** in Git (S8): `public/web.config`, `public/.htaccess`, `public/api/lib/config.php`, `public/api/lib/mailmode.php`. A fresh clone currently cannot run the endpoint.
10. Consider a build-time assertion that `out/web.config` and `public/web.config` are identical, so an export can never carry a stale hosting rule (today `out/web.config` silently lacks the `<security>` block).

### D. Local environment

11. PHP is not on `PATH`; the suite uses the bundled `.pdf-work/tools/php/php.exe`. Document it, or add a `PHP=` variable to the test harness. No Composer is needed — the backend has no third-party PHP dependencies.

### E. Tests requiring approval or production access

12. SMTP probe on production (needs token; opens a connection, sends nothing).
13. A real end-to-end delivery test (sends real mail — requires explicit authorisation).
14. A post-deployment re-run of the two §5.5 probes.

---

## 15. Exact files requiring changes

**For the bug as reported: none in source.** The fix is a deployment artefact.

| File | Change | Reason |
|---|---|---|
| **`httpdocs/web.config`** (server) | **Replace** with [public/web.config](public/web.config) | F1/F2/F4 — `existingResponse="PassThrough"`, 404 `responseMode="File"`, `<security>` block |
| `httpdocs/api/submit.php` (server) | Replace with [public/api/submit.php](public/api/submit.php) | adds the mail-mode gate |
| `httpdocs/api/health.php` (server) | Replace with [public/api/health.php](public/api/health.php) | mode/probe report — the diagnostic that settles F3 |
| `httpdocs/api/lib/config.php` (server) | Replace with [public/api/lib/config.php](public/api/lib/config.php) | blanks the unresolvable default host; no credentials in it |
| `httpdocs/api/lib/mailmode.php` (server) | **Add** — [public/api/lib/mailmode.php](public/api/lib/mailmode.php) | required by the new `submit.php`; **absent from the export** |
| `httpdocs/api/lib/mailer.php` (server) | Replace | password required only when a mailbox is configured |
| `httpdocs/api/lib/request.php` (server) | Replace | honest `post_max_size` reporting |
| `httpdocs/api/lib/guard.php`, `forms.php`, `uploads.php`, `.htaccess` ×2, `config.*.example.php` | Replace / add | keep the endpoint and its templates in step |
| **`aero-config.php`** (beside `httpdocs/`) | **Create on the server** | real credentials; never uploaded |

All of the above are already staged by `npm run pack:api` into [api-package/](api-package/MANIFEST.json) and `aerocotton-api-upload.zip` — 15 files, verified byte-identical to `public/`, with `api/config.php` excluded by name and the archive scanned for credentials before it is written. **`out/` is not touched by that packer and was not touched here.**

Optional source changes (hardening, not required for the bug): the four Git-tracking additions and the build-time `web.config` assertion in §14 C.

---

## 16. Production verification checklist

Run in this order after the upload. None of these sends an email.

```
[ ] 1.  Backup restored and reachable — rollback tested on paper.

[ ] 2.  GET  /api/submit.php
            expect: 405, Content-Type: application/json,
                    {"ok":false,"message":"This endpoint accepts POST requests only."}
            TODAY : 405, text/html, IIS 405 page                       ← must change

[ ] 3.  POST /api/submit.php?form=nonsense   (Content-Type: application/json, body {"form":"nonsense"})
            expect: 400, application/json,
                    {"ok":false,"message":"We could not tell which form that was…"}
            TODAY : 400, text/html, "Bad Request"                       ← must change

[ ] 4.  OPTIONS /api/submit.php
            expect: 204 (PHP). Note: IIS may still answer 200 itself — informational only,
                    the form is same-origin and sends no preflight.

[ ] 5.  GET  /api/this-path-does-not-exist-xyz
            expect: 404 with the exported 404 page
            TODAY : 200 with the exported 404 page                      ← must change (S2)

[ ] 6.  GET  /api/lib/mailer.php
            expect: 404, and no library source
[ ] 7.  GET  /api/config.php
            expect: 404, and never the credentials file
[ ] 8.  GET  /web.config
            expect: 404 / blocked (it must not be downloadable)

[ ] 9.  GET  /api/health.php?token=<health_token>
            expect: 200 application/json — mail_mode, problems[], warnings[], checks{},
                    config.file_found, storage writability, PHP limits.
            Record: which file supplied the configuration, and which setting is missing.

[ ] 10. GET  /api/health.php?token=<health_token>&probe=1
            expect: 200, probe.ok true, stopped_at "authenticated".
            NOTE  : opens one SMTP connection, authenticates, sends nothing.
            Record: stopped_at — "connection" means the host is wrong,
                    "tls" means the encryption mode is wrong,
                    "authentication" means the credentials are wrong.

[ ] 11. Confirm no SMTP host in the report is a non-resolving name.

[ ] 12. Confirm mail_mode is "sample", mail_sample_approved true, and that
        mail_production_approved is still false.

[ ] 13. Submit the contact form once from a browser.
            expect: 200, a reference AH-YYYY-NNNNNN, and the receipt shown.
            Any failure now states its real reason.

[ ] 14. With the owner's explicit authorisation, confirm the reviewer's mailbox
        received the sample — and ONLY then flip mail_mode to production.

[ ] 15. Re-run `npm test` and `tests/export.test.mjs` locally: the protected export
        must still be 542 files, every SHA-256 identical.
```

---

### Statement of work performed

Read-only throughout. No file in the repository was created, modified or deleted except this report. `out/` and `out/index.html` were read only — never rebuilt, never written. No production deployment, no DNS change, no hosting change, no real email, no credential accessed, reused or printed. Local diagnostics ran against a throwaway copy of the export in a temp directory that was deleted afterwards, and the production probes were limited to requests that write no state and cannot trigger a send.
