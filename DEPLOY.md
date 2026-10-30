# Uploading the site (FileZilla → BigRock)

The build is already done: `npm run build` writes everything the host needs into
`out/`. Uploading is the only remaining step, and it is one folder.

> **Superseded for the enquiry backend.** This document is the site's original
> upload walkthrough, and it still describes the first deployment of the whole
> `out/` tree — useful for a new host or a fresh clone. The contact-form backend
> now ships separately, with a delivery-mode gate and an approval workflow:
> use [DEPLOYMENT_MANIFEST.md](DEPLOYMENT_MANIFEST.md) for the file list and
> [PRODUCTION_HANDOVER.md](PRODUCTION_HANDOVER.md) for credentials, the
> sample-review step and the post-deployment checks. Where the two disagree
> about the backend, those two documents are correct.

## The rule that everything else follows

> Upload the **contents of `out/`** into the **web root** — never the `out`
> folder itself.

The web root is the folder the domain points at. If the `out` folder itself
lands there, the site ends up at `https://your-domain/out/` and
`https://your-domain/` shows nothing — which is the most common way this step
goes wrong.

## Two ways to send it

| | One zip — **recommended** | Drag the folder |
|---|---|---|
| How | `npm run pack`, upload `aerocotton-site-upload.zip`, extract it in the host's file manager | Select `out/`'s contents in FileZilla and drag them across |
| Files | 1 | 540 (39 MB) |
| Risk | none beyond extracting in the right place | a dropped connection leaves a half-copied site; hidden files are skipped unless a setting is changed |
| Best when | always, unless you are only replacing one file | you changed one page, or have no file manager |

Both put the same bytes on the server — the zip is made from `out/` and is
verified to reproduce it exactly.

## Method A — the zip (5 minutes)

1. ```bash
   npm run pack
   ```
   This rebuilds the site and writes `aerocotton-site-upload.zip` (≈31 MB,
   540 files) at the project root. It refuses to produce an archive that is
   missing `.htaccess`, `web.config` or the `api/` endpoint.
2. In FileZilla, connect and open the **web root** in the right-hand pane.
3. Drag `aerocotton-site-upload.zip` from `E:\Aerocotton\` into that pane and
   let the transfer finish — one file, so watch it reach 100%.
4. In the host's control panel open **File Manager**, go to the web root, tick
   the zip and choose **Extract**.
5. **Delete the zip.** It is a complete second copy of the site and would be
   downloadable by anyone who guessed the name.

## Method B — FileZilla drag and drop

1. Rebuild first if anything changed: `npm run build`.
2. **Turn on hidden files:** FileZilla → *Server* → **Force showing hidden
   files**. Without this, `.htaccess` is not listed and therefore not uploaded —
   and that one file is what stops the mail password being downloadable.
3. Left pane: navigate into `E:\Aerocotton\out`.
4. Right pane: navigate to the web root.
5. Select **everything inside `out/`** — `Ctrl+A` with the file list focused,
   not the `out` folder in the pane above.
6. Drag it to the right pane. When asked, choose **Overwrite** (or *Overwrite if
   different size*) and tick *Always use this action* for the rest.
7. Leave the transfer type on **Auto** (binary). Text mode would corrupt images,
   fonts and the video.
8. Confirm the transfer queue ends with 0 failed files.

## Where is the web root?

Find the existing website rather than guessing: it is the folder that already
holds a `default` or `index` page belonging to the domain.

| Host panel | Typical web root |
|---|---|
| cPanel (most BigRock shared plans) | `public_html` |
| Plesk | `httpdocs` |
| DirectAdmin | `public_html` |
| Old cPanel | `www` or `htdocs` |

A quick way to be certain: upload a single file called `whoami.txt` into the
folder you believe is the web root, then open
`https://your-domain/whoami.txt`. If you see its contents, that is the right
folder. Delete it afterwards.

## Then check these four things

Do this on the live URL, not on your machine.

1. **`https://your-domain/`** — the designed homepage. If you instead get bare
   black-on-white text with no styling, the files went one level too deep, or
   `_next/` was not uploaded.
2. **`https://your-domain/api/lib/config.php` → must not show credentials.**
   This is the security check that matters: that file holds the mailbox
   password. There are two locks, and they are different on each host:

   | Host | What protects it | How to read the result |
   |---|---|---|
   | IIS / Plesk (this site) | the `AERO_API` guard at the top of the file — PHP runs it, the guard answers 404 and exits | a **404**, or the site's 404 page. Never the settings |
   | Apache / LiteSpeed | `api/.htaccess` (`RedirectMatch 404 ^/api/lib/`) **and** the same guard | a 404 |

   `.htaccess` is ignored by IIS, so on this host the guard is what is actually
   protecting the file — which is why it works as long as PHP is executed.
   **If you ever see PHP source in the browser rather than settings or a 404,
   the PHP handler has stopped running and the password is exposed: fix that
   before announcing the site.** A blank page or a `{}` is also wrong — it
   means the file was *run* as a script; only a 404 is correct.
3. **`https://your-domain/about/`** → loads directly, and clicking a link in the
   header changes the page without a full reload.
4. **The contact form** → submit it and check the inbox (see the two empty
   settings below).

## The enquiry form cannot send mail until the mailbox is configured

This is the one thing that cannot be fixed by uploading files: the endpoint
needs a mailbox to send through, and no password is configured. Until it is,
every submission is **accepted, validated, given a reference and written to the
server log** — but delivery fails, and the visitor is told so honestly.

`public/api/lib/config.php` already has the mail host and the inbox address.
Fill in these two:

| Setting | What to put there |
|---|---|
| `smtp_user` | the full mailbox address the site sends from, e.g. `enquiries@aerocotton.in` |
| `smtp_pass` | that mailbox's password |

`from_email` may stay blank — it then reuses `smtp_user`, which is also the
address your SPF/DKIM records are set up for. If you set it, use a mailbox on
your own domain or the big providers will file the notifications as spam.

`health_token` is blank too, which switches `/api/health.php` off entirely.
Set it to any long random string and you unlock the diagnostic that tells you
whether PHP can read the config, reach the mailbox and write its own data.

**Never put these in chat, in a front-end file, or in the built `out/` tree.**
The endpoint accepts them from three places, highest priority first:

| Where | How | Reachable over HTTP? |
|---|---|---|
| **1. A file beside `httpdocs`** *(safest — recommended)* | create `aero-config.php` in the folder that **contains** `httpdocs`, one level above the site. Same array format as the table above | **no** — it is outside the web root, so no URL can ever fetch it |
| **2. Environment variables** | in Plesk: *Websites & Domains → your site → PHP Settings → Additional environment variables*, add `AERO_SMTP_USER` and `AERO_SMTP_PASS` (any setting: prefix `AERO_` + the config key in capitals) | **no** — nothing is written to disk in the site |
| **3. `httpdocs/api/lib/config.php`** | edit the two values already in that file | no source disclosure (PHP runs it), **but** it is inside the web root and only stays private while PHP keeps executing |

All three are verified working. Options 1 and 2 are safer precisely because the
mailbox password is never inside the folder the web server serves — if the PHP
handler ever stops running, option 3's file falls back to being a plain
text file.

A one-line example of option 1, saved as `aero-config.php` next to `httpdocs`:

```php
<?php
return [
    'smtp_user' => 'enquiries@aerocotton.in',
    'smtp_pass' => 'the mailbox password',
];
```

Only the values you list are overridden; the mail host, inbox address, origins
and limits keep coming from the shipped defaults. Leave `smtp_secure` alone —
it is correct for port 587 already.

### Verifying it, in the order that tells you the most

1. Add the two values by whichever route you chose above — no rebuild or
   re-upload is needed for options 1 and 2, which is most of their appeal. If
   you take option 3, edit `httpdocs/api/lib/config.php` in File Manager
   directly, or change it in the project and re-upload just that one file.
2. Open `https://your-domain/api/health.php?token=<your health_token>` —
   expect `"ok": true` and `smtp_pass: {"set": true, ...}`. Anything listed
   under `problems` is the next thing to fix.
3. Add `&probe=1`. This connects, negotiates TLS and authenticates against the
   mailbox **without sending anything** — so a wrong password is caught here
   rather than by a customer.
4. Submit one real enquiry through the site and confirm it arrives in the
   inbox, with the acknowledgement landing in the enquirer's own inbox.
5. If mail still does not arrive but the probe passes, check SPF/DKIM on the
   sending domain, and the host's outbound mail limits for attachments.

### If the form says the enquiry was not sent

The endpoint only accepts submissions from origins listed in
`allowed_origins` (currently `aerocotton.in`, `www.aerocotton.in` and two local
test addresses). If the site is served from any other address — a temporary
host name, a staging domain — submissions are rejected even though the pages
work. Add that address to the list and re-upload the config.

## Why the form used to say "the service is not responding"

It wasn't. The endpoint was answering correctly the whole time — the web
server was throwing the answer away.

`/api/submit.php` replies in JSON, *including* when something is wrong: a 422
naming the fields to fix, a 403 for an unknown origin, or a 502 saying the mail
could not be delivered. IIS's `httpErrors` setting had
`existingResponse="Replace"`, which discards the body of any response carrying
an error status and substitutes IIS's own error page. For a 422 that page is
literally the sentence *"The custom error module does not recognize this
error."* The form tried to parse that as JSON, failed, and fell back to its
generic message — so every possible failure looked identical, and the real
reason never reached anyone.

[web.config](public/web.config) now sets `existingResponse="PassThrough"`, so
the endpoint's own JSON and status code reach the form. IIS's own errors — a
genuinely missing file — still get the branded 404 page, and the 404 now keeps
its **404 status** instead of being reported as a 200.

If the form ever reports a problem again, it will name the actual cause. The
server-side record of every attempt is in `api/logs/submissions.log` on the
host: one JSON line per event, including failures, with the visitor's answers
intact — so a delivery problem never loses a lead.

## Worth knowing

- **The site must sit at the root of a domain or subdomain,** not at
  `your-domain/shop/`. The export uses root-relative paths, so a subpath breaks
  every image, script and stylesheet.
- **FTP sends your password in clear text.** If BigRock offers SFTP on port 22,
  use it — same drag and drop, encrypted.
- **Re-uploads are cheap.** Only changed files are usually re-sent if you use
  FileZilla's overwrite-if-different setting, so a content fix does not mean
  re-uploading everything.
