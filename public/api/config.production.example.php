<?php

/**
 * Aero Cotton — PRODUCTION template.
 *
 *     cp public/api/config.production.example.php ../../aero-config.php
 *
 * Copy it to the folder that CONTAINS the site root, one level above
 * `httpdocs` — not into `httpdocs` itself. From there no URL can ever fetch it,
 * even if PHP stopped executing.
 *
 *     httpdocs/api/lib/config.php   looks for   <site parent>/aero-config.php
 *
 * If the host will not let you write above the web root, copy it to
 * `httpdocs/api/config.php` instead: that path is denied by .htaccess and by
 * `web.config`, and this is the second-best place rather than the first.
 *
 * Nothing here was guessed. The mailbox settings — host, user, password — ship
 * BLANK rather than as placeholders, because a placeholder is worse than a
 * blank: it reads as a value, so the endpoint would try to connect to a host
 * that does not exist and report "cannot reach the mail server" instead of
 * "smtp_host is not configured". A blank is caught by the mail-mode gate, which
 * refuses to send and names the missing key in
 * /api/health.php?token=<health_token>.
 *
 * So this file does nothing until it is filled in. That is the intended state:
 * the host, port, encryption and authentication method come from whoever
 * administers the mailbox, never from here.
 *
 * ## The two states, and how to move between them
 *
 *   State A — sample review
 *       mail_mode                 'sample'
 *       mail_sample_approved      true          (only when you are ready to send it)
 *       mail_sample_inbox         'jeinfonet@gmail.com'
 *       mail_sample_from          'admin@aerocotton.in'
 *     The endpoint posts one marked, clearly-labelled copy of the real enquiry
 *     notification to the reviewer. Live delivery stays off.
 *
 *   State B — approved production delivery
 *       mail_mode                 'production'
 *       mail_production_approved  true          (only after the sample is approved)
 *       mail_production_inbox     'export@aerocotton.in'
 *     The company inbox gets every enquiry and the enquirer gets a confirmation.
 *
 * Sending a sample does not switch anything on. Neither does a successful SMTP
 * login. The only thing that moves the endpoint out of State A is the operator
 * editing `mail_mode` and `mail_production_approved` here and uploading the
 * file — that edit *is* the recorded approval.
 *
 * @return array<string, mixed>
 */

return [
    'env' => 'production',

    // Start in State A. Change to 'production' only after the sample is signed off.
    'mail_mode' => 'sample',

    /* ── The reviewer's copy (State A) ─────────────────────────────────── */

    'mail_sample_inbox' => 'jeinfonet@gmail.com',
    'mail_sample_from' => 'admin@aerocotton.in',
    // The client has to authorise the send before this becomes true.
    'mail_sample_approved' => false,

    /* ── Live delivery (State B) ───────────────────────────────────────── */

    'mail_production_inbox' => 'export@aerocotton.in',
    // Blank reuses smtp_user, which is the mailbox your SPF and DKIM cover.
    'mail_production_from' => '',
    // Set true only once the client has approved the sample.
    'mail_production_approved' => false,

    /* ── The mailbox — ask the provider, do not guess ───────────────────── */

    // BLANK = not configured, and the endpoint refuses to send. Fill in the
    // host the provider gives you, exactly as they write it.
    'smtp_host' => '',

    // 587 with STARTTLS is the near-universal submission port; change it if the
    // provider says otherwise. Blank with port 587 resolves to 'tls' and blank
    // with 465 resolves to 'ssl', so leaving smtp_secure blank below is the
    // safer choice: changing the port alone still gets the encryption right.
    // Its environment-variable spelling is AERO_SMTP_ENCRYPTION, and
    // AERO_SMTP_SECURE works too.
    'smtp_port' => 587,
    'smtp_secure' => '',

    // The mailbox the site sends through, and its password. If the provider
    // issues an application password, this is that — not your login password.
    // Both blank = not configured, and the endpoint refuses to send.
    'smtp_user' => '',
    'smtp_pass' => '',

    'smtp_timeout' => 30,

    'from_name' => 'Aerocotton Website',
    'brand' => 'Aerocotton',

    /* ── Who may post ──────────────────────────────────────────────────── */

    'allowed_origins' => [
        'https://aerocotton.in',
        'https://www.aerocotton.in',
    ],

    /* ── Abuse limits ──────────────────────────────────────────────────── */

    'rate_limit_max' => 5,
    'rate_limit_window' => 600,
    'daily_limit' => 60,

    /* ── Attachments ───────────────────────────────────────────────────── */

    'allow_uploads' => true,
    'max_upload_bytes' => 4194304,
    'max_upload_files' => 3,
    'max_upload_total' => 6291456,

    /* ── Diagnostics ───────────────────────────────────────────────────── */

    // A long random string, treated like a password: it is the only thing
    // between the public internet and the report at /api/health.php. Blank
    // ships deliberately, and blank means the page answers 404 to everyone —
    // it fails closed rather than accepting a token that is printed in a
    // shipping file. Generate one, e.g. 32+ random characters, and set it here
    // or as AERO_HEALTH_TOKEN.
    'health_token' => '',

    // Never true in production: it returns the SMTP conversation to callers.
    'debug' => false,
];
