<?php

/**
 * Aero Cotton — every setting the mail endpoint understands, and nothing else.
 *
 * This file is documentation, not a template to fill in: it is never loaded.
 * Copy the template for the state you are actually in.
 *
 *     local development      cp public/api/config.local.example.php public/api/config.php
 *     production             cp public/api/config.production.example.php ../../aero-config.php
 *
 * Where a config file may live, in precedence order (later wins):
 *
 *   1. `AERO_CONFIG_FILE` — an absolute path, if set
 *   2. `public/api/config.php` — beside this file, denied by .htaccess and web.config
 *   3. `<folder containing the site root>/aero-config.php` — outside the web root,
 *      which from `httpdocs/api/lib/` means three directories up
 *
 * Environment variables override all three. Both spellings work:
 *
 *   canonical   AERO_ENV  AERO_MAIL_MODE  AERO_SMTP_HOST  AERO_SMTP_PORT
 *               AERO_SMTP_ENCRYPTION  AERO_SMTP_USER  AERO_SMTP_PASS
 *               AERO_MAIL_FROM  AERO_MAIL_TO  AERO_HEALTH_TOKEN
 *   generic     AERO_<KEY> in capitals, e.g. AERO_FROM_NAME, AERO_RATE_LIMIT_MAX,
 *               AERO_ALLOWED_ORIGINS (comma-separated), AERO_MAIL_SAMPLE_APPROVED=1
 *
 * ── The mail modes, and what each one is allowed to do ──────────────────────
 *
 *   mail_mode = 'local'
 *     Capture into a local SMTP server. Refused unless the SMTP host is on
 *     loopback AND the recipient is at a reserved test domain (.test, .invalid,
 *     .example, example.com), so a demo cannot reach a person.
 *
 *   mail_mode = 'sample'
 *     Send a marked copy to the reviewer. Needs mail_sample_approved = true.
 *     Refused on a loopback host.
 *
 *   mail_mode = 'production'
 *     Send for real. Needs mail_production_approved = true and a complete
 *     mailbox setup (host, user, password, valid sender). Refused on a loopback
 *     host.
 *
 * Neither approval flag is ever inferred. Not from a successful SMTP login, and
 * not from having just sent a sample.
 *
 * ── Settings ───────────────────────────────────────────────────────────────
 *
 *  env                        development | staging | production. Reported by
 *                             health.php; does not itself change routing.
 *  mail_mode                  local | sample | production. Decides everything.
 *
 *  mail_local_inbox           Recipient while in local mode. Must be unroutable.
 *  mail_sample_inbox          The reviewer (jeinfonet@gmail.com as requested).
 *  mail_production_inbox      The live company inbox (export@aerocotton.in).
 *  mail_local_from            Sender while in local mode.
 *  mail_sample_from           Sender for the review copy (admin@aerocotton.in).
 *  mail_production_from       Sender for live mail. Blank reuses smtp_user.
 *  mail_sample_approved       bool. Authorises the review copy.
 *  mail_production_approved   bool. Authorises live delivery. Set only after the
 *                             sample has been approved by the client.
 *
 *  smtp_host                  Mailbox provider's submission host. No default on
 *                             purpose — an invented one is worse than a blank.
 *  smtp_port                  Usually 587 (STARTTLS) or 465 (implicit TLS).
 *  smtp_secure                'tls' | 'ssl' | '' (plain, local capture only).
 *                             Blank with 587 resolves to tls, with 465 to ssl;
 *                             any other port with no encryption is refused.
 *  smtp_user                  The mailbox account. May be a full address.
 *  smtp_pass                  Its password, or an application password if the
 *                             provider issues those. Never your login password
 *                             on a provider that has app passwords.
 *  smtp_timeout               Seconds. Default 30.
 *
 *  from_email                 Explicit sender, overriding the mode's own.
 *  from_name                  Display name on the From line.
 *  to_email                   Explicit recipient, overriding the mode's own.
 *                             Still inside the mode's safety rules.
 *  brand                      Names the brand in subject lines.
 *
 *  allowed_origins            Browsers allowed to post. Never a wildcard.
 *  rate_limit_max             Submissions per window, per client.
 *  rate_limit_window          Window length in seconds.
 *  daily_limit                Submissions per day across all clients.
 *  allow_uploads              Whether attachments are accepted.
 *  max_upload_bytes           Per file.
 *  max_upload_files           Count per submission.
 *  max_upload_total           Across all files in one submission.
 *  allowed_upload_types       MIME types kept, decided by finfo on the contents.
 *
 *  turnstile_secret           Cloudflare Turnstile. Blank disables it.
 *  health_token               Unlocks /api/health.php. Blank = the page 404s.
 *  data_dir, log_file         Runtime state. Must be writable by PHP, and must
 *                             not be reachable over HTTP.
 *  debug                      Never true in production.
 *
 * ── What none of this can tell you ─────────────────────────────────────────
 *
 * The endpoint reports whether the mail server *accepted* a message. Only the
 * recipient's mailbox can show that it arrived. Use
 * /api/health.php?token=<health_token>&probe=1 to check the connection, TLS and
 * authentication without sending anything.
 */
