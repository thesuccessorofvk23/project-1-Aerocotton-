# SMTP configuration checklist

Everything the mailbox administrator has to confirm, where each answer goes, and
how to prove it took effect. Nothing in this document is a credential, and
**nothing here has been guessed** — the settings marked *blank* below ship blank
on purpose.

Read alongside [PRODUCTION_HANDOVER.md](PRODUCTION_HANDOVER.md) (the operating
procedure) and [DEPLOYMENT_MANIFEST.md](DEPLOYMENT_MANIFEST.md) (the file list).

---

## 0. Three rules, before anything else

1. **No value in this file is written into the repository, the ZIP, or an email.**
   The `Values` column of the worksheet in §4 is filled in *by hand on the
   server*. Passwords are typed into one of the three locations in §5, which
   are covered by `.htaccess`, `web.config` and a PHP guard — or into Plesk's
   environment variables, where they never touch disk at all.
2. **The password previously shared in chat is not to be reused.** Treat it as
   disclosed. Ask the administrator to rotate it, or to issue an application
   password if the provider has that feature.
3. **A blank is not a bug, it is a refusal.** With `smtp_host`, `smtp_user` or
   `smtp_pass` blank the endpoint refuses to send and says exactly which key is
   missing at `/api/health.php?token=…`. It never falls back to an invented
   host — in particular never to `mail.aerocotton.in`, which **does not resolve**
   and was the shipped fault this work removes.

---

## 1. What the endpoint reads

Nine settings, all of them server-side only. The environment-variable spelling
is shown because Plesk's *Additional environment variables* is one of the three
places they can live; the config key is what they set.

| # | Config key | Environment variable | Ships as | Who provides it |
|---|---|---|---|---|
| 1 | `smtp_host` | `AERO_SMTP_HOST` | **blank** | Mailbox administrator |
| 2 | `smtp_port` | `AERO_SMTP_PORT` | `587` | Mailbox administrator (587 unless told otherwise) |
| 3 | `smtp_secure` | `AERO_SMTP_ENCRYPTION` (or `AERO_SMTP_SECURE`) | **blank** | Mailbox administrator |
| 4 | `smtp_user` | `AERO_SMTP_USER` | **blank** | Mailbox administrator |
| 5 | `smtp_pass` | `AERO_SMTP_PASS` | **blank** | Mailbox administrator |
| 6 | `mail_sample_from` / `from_email` | `AERO_MAIL_FROM` | `admin@aerocotton.in` (sample) | Client |
| 7 | `mail_production_inbox` / `to_email` | `AERO_MAIL_TO` | `export@aerocotton.in` | Client |
| 8 | `health_token` | `AERO_HEALTH_TOKEN` | **blank** | Whoever sets the server up |
| 9 | `mail_mode` | `AERO_MAIL_MODE` | `local` | Operator, at the moments in §8 |

Port and encryption, in plain terms:

- `587` with `smtp_secure` blank → **STARTTLS**. The normal case.
- `465` with `smtp_secure` blank → **implicit TLS**.
- A blank `smtp_secure` on any *other* port is refused: the endpoint will not
  send mail unencrypted to a provider. (`local` demo mode is the only mode that
  may talk plaintext, and only to loopback.)
- `smtp_secure` is left blank rather than preset so that changing the port alone
  still selects the right encryption.

---

## 2. Questions only the mailbox administrator can answer

Answer these *before* touching the server. Each one maps to a setting above, and
each one has been the cause of a real failure mode in this project.

| # | Question | Why it matters |
|---|---|---|
| 1 | **Which provider actually hosts the mailbox for the domain?** Today the domain's MX records point at **Google Workspace**, not at a BigRock mailbox. So the submission host is unlikely to be anything on `aerocotton.in`. | The whole point of the ship-blank rule: a plausible-looking host that belongs to the wrong provider fails at connect time and *looks* like a network fault. |
| 2 | **Does the mailbox `admin@aerocotton.in` exist, and may it send?** | It is the intended sample-review sender. |
| 3 | **What is the exact SMTP submission hostname?** (e.g. `smtp.gmail.com`, `smtp.<provider>.net`) | `smtp_host` |
| 4 | **Port and encryption:** 587 STARTTLS, 465 implicit TLS, or something else? | `smtp_port`, `smtp_secure` |
| 5 | **Is SMTP AUTH enabled for the account?** Google Workspace, for instance, does not accept the account password for SMTP — it requires an **app password** (or OAuth, which this endpoint does not implement). | `smtp_user`, `smtp_pass` |
| 6 | **If an app password is required, please issue one.** | `smtp_pass` |
| 7 | **Which password/token was shared in chat before?** Confirm it is revoked or rotated. | A disclosed password must not end up in production. |
| 8 | **What From: address may the mailbox send as** — itself (`admin@aerocotton.in`), an alias, or `export@aerocotton.in`? | `mail_production_from` (blank reuses `smtp_user`) |
| 9 | **Is there a sending limit** (per hour/day)? | The endpoint's own limits are 5 per 600 s and 60 per day; the provider's limit must be ≥ that, or enquiries will bounce. |
| 10 | **May the server's egress IP connect?** Some providers allowlist submission by IP. | Otherwise the probe fails at connect. |
| 11 | **Are SPF, DKIM and DMARC published for the sending domain?** DMARC is currently missing (`NXDOMAIN`) and MX is Google — so mail sent through a *different* provider will be a `softfail` unless SPF is updated. | Delivered mail will be filtered or rejected. **DNS changes need the domain owner's authorisation** — not part of this task. |

---

## 3. What is already decided (do not change to "fix" a send failure)

| Setting | Value | Note |
|---|---|---|
| `mail_mode` default | `local` | Capture into a local SMTP server. No real mailbox is reachable. |
| `mail_sample_inbox` | `jeinfonet@gmail.com` | The sample reviewer. |
| `mail_production_inbox` | `export@aerocotton.in` | The intended live recipient. |
| `mail_sample_from` | `admin@aerocotton.in` | The client's sending account. |
| `mail_production_from` | blank → `smtp_user` | The mailbox the domain's records cover. |
| `allowed_origins` | `https://aerocotton.in`, `https://www.aerocotton.in` (+ localhost dev ports) | Never a wildcard. |
| `rate_limit_max` / `rate_limit_window` / `daily_limit` | `5` / `600` / `60` | |
| `debug` | `false` | Never `true` in production. |
| Approval flags | `false` | Never inferred; see §8. |

Changing a real-send failure by editing the recipient is never the fix. The
recipient table is deliberate; a failure means the *mailbox* settings in §1 are
missing or wrong.

---

## 4. Worksheet — fill in by hand, on the server

Do not paste these values into chat, a ticket, an email or a commit. This table
is intentionally blank.

| Setting | Value | Confirmed by | Date |
|---|---|---|---|
| `smtp_host` |  |  |  |
| `smtp_port` |  |  |  |
| `smtp_secure` (`tls` / `ssl` / blank) |  |  |  |
| `smtp_user` |  |  |  |
| `smtp_pass` (app password if issued) |  |  |  |
| `from_email` (if not `smtp_user`) |  |  |  |
| `health_token` (32+ random characters) |  |  |  |
| Client approval for the sample (name/date) |  |  |  |
| Client approval for live delivery (name/date) |  |  |  |

---

## 5. Where the values go — one of three places

Precedence, lowest to highest: this file's defaults → a config file → environment
variables. Pick **one** for the credentials and stay with it.

| Where | How | Password on disk? |
|---|---|---|
| **1. `aero-config.php` beside `httpdocs`** (recommended) | Copy `api/config.production.example.php` to the folder that *contains* `httpdocs`, name it `aero-config.php`, fill in §1 | No — outside the web root, unreachable by any URL |
| **2. Plesk environment variables** | *Websites & Domains → the site → PHP Settings → Additional environment variables*: set the `AERO_*` names from §1 | No — nothing is written to disk |
| **3. `httpdocs/api/config.php`** | Copy the template there | Yes — inside the served folder, denied by `web.config`, `.htaccess` and a PHP guard |

Whichever is used: **never** put these values in the repository, in
`aerocotton-api-upload.zip`, in frontend code, or in a log. The packer refuses to
build if a filled-in password appears in anything it stages.

---

## 6. Verify before the first submission

Replace `<token>` with the value set in §4.

```
1.  GET https://aerocotton.in/api/health.php                    → 404, "Not Found"
2.  GET https://aerocotton.in/api/health.php?token=<token>      → 200 JSON
```

In the JSON from step 2, in this order:

| Field | Expected |
|---|---|
| `report.config.source` | `"config file"` or `"AERO_CONFIG_FILE"` — not `"defaults"`, unless the variables were set in Plesk |
| `report.mail.mode` | `"sample"` for the first run |
| `report.mail.delivery_enabled` | `true` only once §1 is complete and the mode's approval flag is set |
| `problems` | **`[]`**. Anything here names the exact missing key, e.g. `smtp_host is not configured` |
| `report.endpoint.extensions.openssl` | `true` — without it TLS is impossible |
| `report.storage.data_writable` / `logs_writable` | `true` |
| `report.config.smtp_pass` | `{ set: true, length: N }` — presence and length only, never the value |
| `checks.message_acceptance.ok` | `null` — the health check never sends mail |
| `checks.inbox_delivery.ok` | `null` — arrival cannot be observed from the server |

Then the connection probe, which authenticates and **sends nothing**:

```
3.  GET https://aerocotton.in/api/health.php?token=<token>&probe=1
        → probe.attempted: true
        → probe.ok: true
        → probe.stopped_at: "authenticated"
```

Only after that probe is `true` is "the mailbox accepts our credentials"
established. It is **not** proof that mail arrives — see §8.

---

## 7. When the probe fails, what it means

`probe.stopped_at` is a hint derived from the SMTP client's own error, not a
diagnosis; the masked SMTP transcript is in `probe.transcript` and in
`api/logs/submissions.log`.

| Symptom | Most likely cause | Where to look |
|---|---|---|
| `stopped_at: "connection"`, `Cannot reach the mail server` | Hostname wrong, outbound SMTP blocked by the host, provider IP-allowlist | §2 questions 3, 10; `nslookup` the host |
| `Cannot reach the mail server` with a *hostname that does not resolve* | The host is a guess, not an answer | §2 question 3 — this is exactly the `mail.aerocotton.in` failure |
| `stopped_at: "tls"`, `TLS negotiation failed` | Port/encryption mismatch (587 vs 465), or a self-signed certificate | §2 question 4 |
| `stopped_at: "authentication"`, `Mail server replied 535` | Wrong password, or a normal password where the provider requires an **app password** | §2 questions 5–7 |
| `referral`/`503` on the submission itself, `problems` non-empty | The mail-mode gate refused before connecting — a missing key or an approval flag that is not set | §1, §8 |
| Everything green but nothing in the inbox | Delivery, not acceptance. Check spam, then SPF/DKIM/DMARC | §2 question 11 |

---

## 8. Sign-off, in the only order that is safe

| Step | State to set | Flag | Evidence to keep |
|---|---|---|---|
| 1. Configure | `mail_mode` = `sample` | `mail_sample_approved` = `true` | `probe.ok: true` output |
| 2. Send the review copy | — | — | The reviewer's copy in `jeinfonet@gmail.com`, subject prefixed `[SAMPLE FOR REVIEW]` |
| 3. Client approves | — | — | Written approval: who, when |
| 4. Go live | `mail_mode` = `production` | `mail_production_approved` = `true` | One real submission, reference `AH-YYYY-NNNNNN`, notification in `export@aerocotton.in` |
| 5. Roll back if needed | `mail_mode` = `local` | — | Delivery stops at once; nothing else changes |

Neither approval flag is ever inferred — not from a successful SMTP login, not
from having just sent a sample. Only the operator setting it is the approval.

**Sending the sample does not switch live delivery on**, and step 4 is a
separate, deliberate edit.

---

## 9. Not done here, and deliberately

| Not done | Why |
|---|---|
| No credential was invented, guessed, or typed into any file | The three settings that need one ship blank, and the gate refuses without them |
| No DNS record was created or changed (SPF/DKIM/DMARC) | DNS changes need the domain owner's authorisation; §2 question 11 lists what is needed |
| No connection was made to any real mailbox | The only SMTP server used by this work is a local capture server on loopback |
| No email was sent, sample or live | Delivery is step 3 above, and it needs the client's approval |
| `/api/health.php?token=…&probe=1` was not run against production | It authenticates against the real mailbox; it is the first thing to run once §1 is filled in |

*Document generated 14 October 2026. Values marked **blank** are enforced by
`tests/api.test.mjs` test 19: no shipped file may carry a non-blank
`smtp_host`, `smtp_user` or `smtp_pass`, and none may mention
`mail.aerocotton.in`.*
