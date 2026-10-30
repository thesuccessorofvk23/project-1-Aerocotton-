# Aero Cotton — Premium Digital Experience

The new aerocotton.in: a multi-page B2B platform for a family-run cotton
home-textile manufacturer in Karur, Tamil Nadu, exporting since 2015.

Brand concept — **"Ten Landscapes, One Thread"**: the ten existing collections
(Nature, Mountain, Beach, City, Forest, Lake, Desert, Waterfall, Snow, Aurora)
are treated as named landscapes. Each carries a dye palette that drives the
procedural WebGL fabric hero and every page accent. One shader, ten moods.

## Running the site

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build; exports the site to out/
npm run pack       # build, then wrap out/ in one uploadable zip
npm run open       # serve the built out/ over HTTP and open the browser
npm run typecheck  # strict TypeScript, no emit
```

### Looking at a production build

`npm run open` — or double-click **View Site.cmd** — serves `out/` over HTTP
and opens the browser at it. Deployment is the same folder: upload the
**contents of `out/`** into the hosting document root (`httpdocs/` on BigRock).

Do not open `out/index.html` from the file system. The export is written with
root-relative URLs (`/_next/...`, `/images/...`), which is what a web server
expects; a browser opening the file directly resolves them against the root of
the drive, so the page appears as unstyled HTML with no images, video or
JavaScript. `out/` therefore only works over HTTP — which is exactly how
BigRock serves it. `web.config` (IIS) and `.htaccess` (Apache/LiteSpeed) travel
inside `out/` and supply the default document, a real 404 and the MIME types
the export uses. The site must sit at the root of a domain or subdomain: a URL
subpath such as `example.com/aerocotton/` does not work, because the same
absolute paths cannot be prefixed without rewriting every image reference in
the components and CSS.

Copy `.env.example` to `.env.local` and set:

| Variable | Purpose | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, OG | for production |
| `RESEND_API_KEY` + `RFQ_TO_EMAIL` + `RFQ_FROM_EMAIL` | RFQ email delivery | for production (without it, enquiries log to the server console) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Form spam protection | optional but recommended |

## Architecture

- **Next.js 16 App Router** — static-first; only `/contact` renders per-request.
- **TypeScript strict**, Tailwind CSS v4 (tokens in `src/styles/tokens.css`).
- **Procedural fabric hero** — vanilla three.js in a single lazy chunk
  (`src/components/three/`). No textures: folds are fbm noise in the vertex
  shader, weave is procedural in the fragment shader. Dye palettes crossfade via
  the `uDissolve` uniform.
- **Realtime product models** — the only real geometry on the site: a Wavefront
  `.obj` or a textured `.glb` under `public/models/`, drawn by `ModelCanvas.tsx`
  (vanilla three.js + `OBJLoader`/`GLTFLoader` behind a dynamic import, drag to
  turn, idle drift, paused offscreen). It rides the same fallback ladder as the
  hero and sits on top of the product's still image, which stays whenever WebGL
  is unavailable.
- **Fallback ladder** — full WebGL → light WebGL (small geometry, clamped DPR)
  → pure-CSS drape → reduced-motion static frame. `src/components/three/capabilities.ts`.
- **Content layer** — `src/content/`. Pages consume `Collection`/`Product`
  types, never files. Company facts live in `src/content/company.ts` with
  CONFIRMED vs PENDING clearly separated. Migrating to a CMS later means
  replacing the loaders, not the UI.
- **RFQ pipeline** — shared zod schema (client + server) → honeypot →
  IP rate limiting (in-memory, swap for Redis when scaling out) → optional
  Turnstile → Resend email with reply-to. `src/lib/rfq/`. **Superseded** by
  the mail endpoint below, which runs on the PHP host the site is deployed to;
  nothing reads `src/lib/rfq/` any more.
- **Enquiry & support pipeline** — see “Enquiries & support — the mail
  endpoint”. The event is emailed, never simulated.
- **Motion** — ~450 ms page transitions, one-shot IntersectionObserver reveals,
  all gated on a `.js` class and `prefers-reduced-motion` in `globals.css`.
- **Opening curtain** — first-visit-per-session brand moment (~3 s, home page
  only, `src/components/home/CinematicLoadingScreen.tsx` + the `.cinematic-intro`
  block in `globals.css`): two grain-textured ivory doors hold a staggered
  AERO COTTON lockup and a brass-thin seam, then part outward to reveal the
  page as the lockup halves ride with them. It is CSS-only, driven by the
  before-paint script in `src/app/layout.tsx` that adds `intro-armed` to
  `<html>` once `sessionStorage` says the session is new — append `?intro` to
  the homepage URL to replay it for review. Repeat visits, reduced-motion
  visitors, other routes and JavaScript-less visitors never see it. The overlay is `pointer-events: none` and scroll is locked only while
  the doors are shut, so it can never gate the page.

## Client fact inventory — required before launch

Everything rendered today is either **confirmed from the live site** (est. 2010,
family-run, Karur; exporting since 2015; ten collections; tagline) or is
**placeholder editorial copy** written to be replaced. The following must be
collected and swapped in:

| Item | Where it lands | Current state |
| --- | --- | --- |
| Phone, email, WhatsApp Business number | `src/content/company.ts` → footer, contact aside, RFQ | `null` placeholders; graceful "lines being connected" state. The **inbox the forms deliver to** is separate and already configurable: `public/api/config.php` → `to_email` |
| Product categories + real SKUs per collection | `src/content/collections.ts`, `src/content/catalogue.ts` | Real client designs and SKUs (SC-2001 … SC-4001) imported from the decks; sizes, weaves and colourway names are editorial |
| Certification list (or absence) | Sustainability page | Deliberately not rendered; honest-claims note shown |
| Export market list | Global Presence page | Marked `[ pending client confirmation ]` |
| Machinery / capacity figures | Manufacturing page | Omitted; "shared on request" |
| Timeline milestones between 2015 and today | `journey` in `company.ts` | One `[CLIENT]` slot reserved |
| Brand assets (logo, packaging, product photography) | Tokens + imagery | Product photography now real (157 deck images + 31 line-sheet images); editorial plates remain for facility/campaign imagery. Logo artwork supplied and in place in the header, mobile menu and footer (`public/brand/`); vector source still worth requesting |
| 3D samples (cloth bag, block-printed runner) | `public/models/`, both product entries | Buyer-supplied scans; the still on each product page and its card thumbnail are rendered from the model. Confirm the pieces may be shown, whether dimensions may be published, and that the block-printed runner is filed under the right product type |
| Registrations (IEC / GSTIN) | Footer / schema | Not rendered |

**Rule enforced throughout:** nothing unverifiable ships as a claim. Search
`[pending`, `[CLIENT]`, and "placeholder" to find every swap point.

## The catalogue

190 products, each with its own page at `/products/[collection]/[slug]`. Three
sources feed the collections:

| Source | Where | Count |
| --- | --- | --- |
| Hand-written line sheets (Kitchen & Table Presentation, Kitchen Towels CAD, Table Presentation) | `src/content/collections.ts` | 31 |
| Client decks imported from the source files | `src/content/catalogue.ts` | 157 |
| The modelled pieces (cotton tote bag, Beach / block-printed runner, Lake) | `src/content/collections.ts` + `public/models/` | 2 |

Deck imports, with the series facet each one adds to `/products`:

| Deck | Series | Designs | Types |
| --- | --- | --- | --- |
| AUTUMN CUSHION 2026 | Autumn Cushions 2026 | 18 | Cushions |
| Blankets | Blankets | 24 | Blankets |
| PLACE MATS & RUNNERS | Place Mats & Runners | 35 | Runners, place mats |
| CUSHIONS -1 & CHAIR PADS | Cushions & Chair Pads | 45 | Cushions, chair pads |
| TEXTILES - PRODUCT PPT | Textiles Programme | 35 | Cushions, towels, throws, runners, napkins, cloth materials, hang tags |

`Kitchen Towels CAD` arrives again as a re-download; it is already catalogued
from the earlier pass and was not imported twice.

Every deck product spreads across the ten landscape collections in deck order
(see `collections:` on each deck in `catalogue.ts`), so each collection page
carries a mix of programmes. Product copy generated from the deck tables is
placeholder-grade — sizes, weaves and colourway names are editorial — and the
client's SKU codes (SC-2001 … SC-4001) are used verbatim where the deck labels
them.

### Re-importing a deck

The client decks live as `.pptx` (with PDF exports) outside the repo. The
pipeline is three scripts, all Node built-ins + `sharp`:

```bash
# 1. pull every embedded image out of the PDF export
node scripts/pdf-images.mjs extract "<deck>.pdf" --out .pdf-work/raw

# 2. normalise slide order (uses the .pptx when available, for full quality)
unzip -oq "<deck>.pptx" -d .pdf-work/pptx/<deck>
node scripts/pptx-catalog.mjs .pdf-work/pptx/<deck>
node scripts/normalize-media.mjs

# 3. add the deck to src/content/catalogue.ts, then write the shipped images
node scripts/build-catalogue-images.mjs --check   # verifies every source resolves
node scripts/build-catalogue-images.mjs           # writes public/images/products/<deck>/
```

`scripts/montage.mjs` builds labelled review sheets from any image folder.

### The brand lockup

The client's logo export is a flattened RGB file on a light studio plate, so it
cannot sit on the cocoa footer or over the hero film as delivered.
`scripts/import-brand-logo.mjs` keys the plate out to real alpha — alpha from
plate deviation, then unpremultiplied so anti-aliased edges keep their colour —
and writes the two files the site ships:

- `public/brand/aerocotton-mark.png` — the monogram, used in the header and the
  mobile menu (the wordmark is illegible at nav scale)
- `public/brand/aerocotton-lockup-dark.png` — the full lockup with its strap-line
  re-inked light, used in the footer

```bash
node scripts/import-brand-logo.mjs "<LOGO.png>"
```

### The hero film

The home page's `<video>` plays `public/hero/hero-cotton-intro.mp4`. Masters
arrive straight out of an editor — 1080p at ~22 Mbps — which is ten to twenty
times the bitrate the page can justify: GitHub warns above 50 MiB per file and
rejects anything over 100 MiB, so a raw master cannot be pushed at all.
`scripts/import-hero-video.mjs` re-encodes it to CRF 22 (measured SSIM ~0.985
against the master — under 1% mean pixel difference), which lands around 4 Mbps
at 1080p:

```bash
node scripts/import-hero-video.mjs "<master.mp4>"
```

ffmpeg is not a project dependency; the script uses `$FFMPEG`, then `ffmpeg` on
`PATH`, then a scratch install at `.pdf-work/tools/` (`npm install ffmpeg-static@5`).
Editor exports also tend to carry zero-duration duplicate frames in their `stts`
table, which the encode drops on the way to a clean 30 fps timeline — see the
header of the script before changing its flags.

### The modelled pieces

Two products carry a `model` field — `Cotton Tote Bag` (Beach, an untextured
`.obj`) and `Block-Printed Fringed Runner` (Lake, a textured `.glb`).
`src/content/types.ts` defines it as an optional path; when it is set, the
product page renders `ProductModel` in place of the still photograph, and
section 03's centre card on the home page links to the tote bag's product page
instead of to its collection.

A `.glb` keeps its own material and embedded base-colour/ORM/normal textures.
An `.obj` from the converter carries neither, so the surface colour is the
house cotton material's job, not the file's. To add another model:

```bash
# 1. ship the geometry
cp "<scan>.glb" public/models/<slug>.glb

# 2. render a catalogue-style thumbnail from it (no CAD software needed)
node scripts/render-mesh-preview.mjs public/models/<slug>.glb \
  --out public/images/products/<range>/<slug>.jpg \
  --yaw -1.35 --pitch 0.06 --zoom 0.86 --w 900 --h 1125 --bg f5f1ea

# 3. add the Product with `model: "/models/<slug>.glb"` and rebuild
```

`scripts/render-mesh-preview.mjs` is a software rasteriser written for exactly
this: it parses an `.obj` (`v`/`vt`/`vn`/`f`) or a `.glb` (glTF accessors, node
transforms), interpolates the model's own vertex normals per pixel, lights the
result with a key + fill pair and, for a GLB, samples the embedded base-colour
texture through the model's UVs. A low-poly scan therefore reads as a soft clay
render rather than as faceted triangles, and a textured one keeps its print.
`--views all` prints a four-angle contact sheet — the fastest way to identify a
model before anything is wired in, and `--flat` forces the untinted silhouette
path. Pass `--tint <hex>` to colour an untextured model.

### Adding a single product

1. Add the image under `public/images/products/`.
2. Either add a `Product` entry to the collection in `src/content/collections.ts`,
   or — for deck imports — add one line to the deck's `entries` in
   `src/content/catalogue.ts` and run `scripts/build-catalogue-images.mjs`.
3. Rebuild. Routes, sitemap entries, breadcrumbs, JSON-LD and related-product
   links are all derived automatically.

## Enquiries & support — the mail endpoint

`/contact` and `/support` are working forms, not mock-ups. Both post to one
endpoint that ships with the site, `public/api/submit.php`, which sends the
notification over authenticated SMTP and answers the browser **only after the
mail server has accepted the message**. If delivery fails the visitor is told
so — never shown a confirmation — and the submission is written to the private
log so an enquiry is never lost.

| Concern | Where it lives |
| --- | --- |
| The two forms | `src/components/forms/` — `EnquiryForm.tsx`, `SupportForm.tsx`, shared `form-kit.tsx` and `use-submission.ts` |
| Field contracts | `src/lib/forms/schema.ts` (fast answer in the browser) and `public/api/lib/forms.php` (the authority) |
| Option lists | `src/lib/forms/options.ts`, **mirrored** in `public/api/lib/forms.php` — add to both |
| Endpoint | `public/api/submit.php` with `public/api/lib/` |
| Delivery mode | `public/api/lib/mailmode.php` — decides who may receive mail, and refuses when it is not authorised |
| Credentials | `aero-config.php` beside the web root, `AERO_*` environment variables, or `public/api/config.php` — never sent to the browser |
| Diagnostics | `public/api/health.php?token=…` |
| Private log | `public/api/logs/submissions.log` (JSON lines) and `public/api/data/` (rate limits, reference counter) |

### The three delivery modes

The endpoint never chooses a recipient on its own. `mail_mode` decides who may
receive mail, and the gate refuses outright when it is not authorised — a
half-configured server cannot email a customer:

| `mail_mode` | Delivers to | Gate |
| --- | --- | --- |
| `local` | A local SMTP capture server. The recipient must be at a reserved test domain (`.test`, `.invalid`) and the server must be on loopback | none needed — it cannot reach a person by construction |
| `sample` | The reviewer, for approval | `mail_sample_approved` must be true |
| `production` | The company inbox, plus a confirmation to the enquirer | `mail_production_approved` must be true **and** the mailbox must be fully configured |

Approval is never inferred — not from a successful SMTP login, and not from
having just sent a sample. Demo messages carry a banner and a
`[SAMPLE FOR REVIEW]` / `[LOCAL CAPTURE]` subject prefix; production mail has
neither. **[PRODUCTION_HANDOVER.md](PRODUCTION_HANDOVER.md)** §4 walks through
the two edits that switch modes, and the rollback.

### Running it locally

PowerShell, from the repository root:

```powershell
# 1. Once: the local stack needs two tools. The script looks for them under
#    .pdf-work/tools/ first, then on PATH, then at AERO_PHP / AERO_MAILPIT.
php --version          # PHP 8.0 or newer (needs the openssl extension)
mailpit --version      # or: mailpit.exe from github.com/axllent/mailpit/releases

# 2. Start the SMTP capture server and the PHP endpoint, detached.
npm run mail:start                     # capture mode; cannot reach a person

#    ...or rehearse the review flow against the same capture server:
npm run mail:start -- --mode sample

# 3. Point the browser at the local endpoint instead of the shipped one,
#    then start the site as usual.
$env:NEXT_PUBLIC_FORMS_ENDPOINT = "http://127.0.0.1:8787/api/submit.php"
npm run dev

# 4. Use the form at http://localhost:3000/contact, then read the captured
#    mail at http://127.0.0.1:8025 — the notification and the acknowledgement.

# 5. Check which mode the endpoint is in.
Invoke-RestMethod "http://127.0.0.1:8787/api/health.php?token=local-demo" |
  ConvertTo-Json -Depth 6

# 6. Run the checks (starts its own capture server; needs nothing running).
#    45 checks in three suites: the endpoint, the protected export, and the
#    two forms' contract with it. `npm run test:forms` runs the last one alone.
npm test

# 7. Stop what step 2 started.
npm run mail:stop
```

### Looking at the built export

`npm run dev` runs the source. To click through the **export that actually gets
uploaded**, use `npm run start` — or double-click `View Site.cmd` — which serves
`out/` over HTTP and opens it:

```powershell
npm run mail:start     # capture server, so submissions can be delivered
npm run start          # serves out/ on http://localhost:4181
```

The preview runs `/api/submit.php` and `/api/health.php` through PHP, looked up
the same way the mail stack looks it up (`AERO_PHP`, then `.pdf-work/tools/`, then
`PATH`), and proxies them, because that is what the Windows host does. Every
other path under `api/` — the library, the config examples, the runtime data —
answers 404 there exactly as it does in production, and PHP source is never
served as a file. Its rate-limit and log files are written under the git-ignored
`.pdf-work/`, so using the form cannot add anything to `out/`. If 4181 is busy it
binds another port and allows that origin automatically. `--no-php` serves the
files only.

Capture only works if the endpoint is in `local` mode, which it is by default.
`npm run mail:status` reports the processes and the mode; `npm run sample:send`
posts a clearly-marked sample enquiry through the endpoint.

The capture server binds `127.0.0.1` only, accepts only reserved test recipients,
and is started with **no relay and no forwarding flag** — a captured message has
nowhere to go.

Authentication follows the mode, because the two modes need opposite things.
`local` capture sends no credentials at all (`smtp_user` is blank by design), so
the capture server accepts an unauthenticated session, exactly as it always has.
`sample` mode always authenticates, so for that mode the capture server is started
with a password file holding the stack's own synthetic credentials — written into
the git-ignored `.pdf-work/` and removed again on `mail:stop` — and it verifies
them for real: the right password is accepted, a wrong one is refused with `535`,
exactly as production would refuse it. (Mailpit rejects `--smtp-auth-file`
together with `--smtp-auth-accept-any`, so one setting genuinely cannot serve both
modes.)

`npm run mail:start -- --mode sample` is the local rehearsal of the review flow.
The endpoint then runs with `mail_sample_approved` on and the **loopback relay
escape hatch** set — `health.php` reports that as a warning, and it must never be
set on a host that can reach the internet — delivering to the reserved
`sample-review@aerocotton.test`, never the real reviewer. (The real reviewer's
address is still exercised, against this same capture server, by `npm test`.)

The stack refuses to start if it is asked for `--mode production`, if the SMTP
host is not loopback, or if the recipient is not a reserved test address — a
clear message instead of a confusing SMTP failure later. It also refuses to reuse
a capture server it started for the other mode, because Mailpit fixes its
authentication setting at startup and a mismatch would surface as a puzzling
failed send.

The local stack is authoritative for behaviour, not for transport: see
[TEST_REPORT.md](TEST_REPORT.md) §4 for what a local run cannot prove, and
[FINAL_VERIFICATION_REPORT.md](FINAL_VERIFICATION_REPORT.md) for the most recent
end-to-end verification of both trailing entry points.

### Deploying it

The site is already live, so the backend goes up **on its own**:

```powershell
npm run pack:api     # stages api-package/ and aerocotton-api-upload.zip
```

Extract the archive's contents into `httpdocs/`, add the credentials, and check
`https://<domain>/api/health.php?token=<health_token>`. The exact file list, the
backups to take first and the reasons are in
**[DEPLOYMENT_MANIFEST.md](DEPLOYMENT_MANIFEST.md)**; the mailbox settings, the
sample-review step and the post-deployment checks are in
**[PRODUCTION_HANDOVER.md](PRODUCTION_HANDOVER.md)**. Every value that has to
come from the mailbox administrator — and why none of them is guessed or shipped
as a placeholder — is in
**[SMTP_CONFIGURATION_CHECKLIST.md](SMTP_CONFIGURATION_CHECKLIST.md)**. The
mailbox settings ship **blank** on purpose: with a blank `smtp_host` the
endpoint refuses to send and names the missing key, whereas a placeholder would
read as a value and produce *"cannot reach the mail server"* for what is simply
an unset setting. (For a full rebuild from
scratch — a new host, or a fresh clone — `npm run pack` still wraps the whole
`out/` tree, and the older, fuller upload notes are in [DEPLOY.md](DEPLOY.md).
Treat that path as superseded for the backend.)

**Do not re-upload `out/` just to update the endpoint.** It is the site that is
already serving, and the backend package exists so that a mail fix never touches
the homepage.

**GitHub Pages cannot run PHP.** On a purely static host the endpoint is inert,
and the forms say so honestly rather than pretending to succeed. Set
`NEXT_PUBLIC_FORMS_ENDPOINT` to the absolute URL of a host that can run it if
the pages and the endpoint ever live apart; `NEXT_PUBLIC_RFQ_EMAIL` adds an
“email us instead” fallback for the case where nothing answers at all.

### What the visitor gets

- Inline validation on every required field, then server-side validation again.
- A sending state — the button is disabled and the form is `aria-busy`.
- On success, a receipt: **“Request Received”**, the reference number
  (`AH-2026-000123`, sequential per year, from a locked counter file), the time,
  a **Back to home** button and a link to send another.
- A notification to the company inbox with `Reply-To` set to the sender, plus an
  optional acknowledgement to the visitor quoting the same reference.
- Optional attachments (PDF, Word, Excel, CSV, images) up to 4 MB each and
  three files, attached to the notification.

### Security

- Credentials only ever exist in `aero-config.php` beside the web root, in
  `public/api/config.php`, or in `AERO_*` environment variables; the browser is
  told nothing beyond whether the mail was accepted. The preferred location is
  outside the web root, where no URL can fetch it.
- Origin allow-list, per-address rate limit, daily cap, honeypot field and a
  too-fast-to-be-human timing check; Cloudflare Turnstile is enforced when a
  secret is configured.
- Attachments are re-typed by their magic bytes with `finfo` — the browser's
  claimed MIME type and the filename are both ignored — renamed to a safe
  extension, and size-capped per file and in total.
- Input is stripped of control characters and CRLF, so nothing can be injected
  into a mail header; the SMTP conversation is logged with the password masked.

### Not yet on the endpoint

The homepage brief form (`src/components/rfq/RfqForm.tsx`, section 12) still
opens a `mailto:` draft rather than posting to the endpoint, so those enquiries
get no reference number and are not rate-limited or logged. Everything else uses
the endpoint: the contact and support pages, and the product and collection deep
links (`/contact?product=Nature%20collection` lands on the real form with that
collection pre-selected). Moving the homepage form across is a matter of
swapping the component.

The older Resend-based server action that used to sit beside it
(`src/lib/rfq/actions.ts`, `send.ts`, `rate-limit.ts`) has been removed. It was a
second submission endpoint and a second mailer, it was imported by nothing — the
homepage form only ever used `src/lib/rfq/schema.ts`, which remains — and it
could not have run here in any case, because a static export has no server to
run a server action on. Its default sender was `onboarding@resend.dev`, so
wiring it up by accident would have sent enquiries from Resend's demo domain.
The `resend` package is still listed in `package.json`; nothing imports it now.

## Design system quick reference

- Palette: ivory `#f4f0e8` base, charcoal `#171614` ink, brass `#b08d57`
  accent, deep-green `#354a42` alternative. Collection palettes in
  `tokens.css` (`--dye-a/b/c` per `.dye-*` class).
- Type: Fraunces (display, SOFT axis) + Manrope (UI), self-hosted via
  `next/font` in `src/app/fonts.ts`.
- Spacing rhythm and section patterns: reuse `SectionHeading`, `Container`,
  `ButtonLink`, `Reveal` — every page composes from these.

## Launch checklist (short form)

1. Confirm every fact-inventory item above.
2. Commission photography (facility, hands, weave macros, per-collection
   flat-lays) and replace placeholder plates — the current gradients are
   explicitly temporary.
3. Fill in `public/api/config.php` on the host, check
   `/api/health.php?token=…` reports `ok: true`, then send one enquiry through
   each form and confirm the inbox received it.
4. Verify 301s from legacy aerocotton.in URLs and submit the new sitemap in
   Search Console.
5. SPF/DKIM/DMARC on the sending domain so RFQ replies don't land in spam.
