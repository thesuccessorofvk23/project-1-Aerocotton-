<?php

/**
 * Aero Cotton — mail endpoint credentials.
 *
 * COPY THIS FILE TO public/api/config.php AND FILL IN THE REAL VALUES.
 *
 *     cp public/api/config.example.php public/api/config.php
 *
 * config.php is git-ignored and denied by .htaccess: the password never lands in
 * the repository, in the built out/ directory that other people can read, or in
 * front-end JavaScript.
 *
 * Anything you leave out falls back to the defaults in lib/config.php, and an
 * environment variable named AERO_<KEY> (uppercase) overrides both — for
 * example AERO_SMTP_PASS, AERO_TO_EMAIL, AERO_ALLOWED_ORIGINS.
 *
 * Then open https://your-domain/api/health.php?token=<health_token> to confirm
 * that PHP can read the file, reach the mailbox and write its own data.
 *
 * @return array<string, mixed>
 */

return [
    // ── Where enquiries are delivered ───────────────────────────────────
    // The company inbox that receives every contact and support submission.
    'to_email' => 'enquiries@aerocotton.in',

    // ── The mailbox the site sends through (BigRock-hosted domain email) ─
    // This is a real mailbox on your domain, not a guess: the same host,
    // port, address and password you use in Outlook/Gmail to read it.
    'smtp_host' => 'mail.aerocotton.in',
    'smtp_port' => 587,
    // 'tls' = STARTTLS on 587 (recommended) · 'ssl' = implicit TLS on 465
    'smtp_secure' => 'tls',
    'smtp_user' => 'enquiries@aerocotton.in',
    'smtp_pass' => 'PUT-THE-MAILBOX-PASSWORD-HERE',
    'smtp_timeout' => 45,

    // ── The From: line on outbound mail ─────────────────────────────────
    // Must be a mailbox on your own domain, or the big providers will treat
    // the message as spam. Leave blank to reuse smtp_user.
    'from_email' => '',
    'from_name' => 'Aerocotton Website',

    // ── Branding used in the email subject lines ────────────────────────
    // Subjects read "New Contact Inquiry - Aerocotton". Change this one
    // value to rename the brand in every notification.
    'brand' => 'Aerocotton',

    // ── Which browsers may post to the endpoint ─────────────────────────
    // Your live site plus local development. Never a wildcard.
    'allowed_origins' => [
        'https://aerocotton.in',
        'https://www.aerocotton.in',
        'http://localhost:4181',
        'http://127.0.0.1:4181',
    ],

    // ── Abuse limits, per visitor ───────────────────────────────────────
    'rate_limit_max' => 5,      // submissions allowed per window
    'rate_limit_window' => 600, // window length, seconds
    'daily_limit' => 60,        // submissions per day across everybody

    // ── File uploads (off by default) ───────────────────────────────────
    // Turn on to accept artwork, tech packs and photos with a submission.
    // Keep these small on shared hosting: PHP's own upload_max_filesize and
    // post_max_size still cap what the server accepts (health.php reports
    // both). Messages above roughly 10 MB are often refused by the host's
    // outgoing mail limits, so raise these only if the host allows it.
    'allow_uploads' => true,
    'max_upload_bytes' => 4194304, // 4 MiB per file
    'max_upload_files' => 3,
    'max_upload_total' => 6291456, // 6 MiB across all files

    // ── Bot protection (optional) ───────────────────────────────────────
    // Cloudflare Turnstile. Leave the secret blank to rely on the built-in
    // honeypot, timing check and rate limiter alone.
    'turnstile_secret' => '',

    // ── Diagnostics ─────────────────────────────────────────────────────
    // A shared secret that unlocks /api/health.php. Treat it like a password:
    // the health page reports config state, not credentials, but it is still
    // for your eyes only.
    'health_token' => 'PUT-A-LONG-RANDOM-STRING-HERE',

    // Serve the SMTP conversation back in error responses while testing.
    // MUST be false in production.
    'debug' => false,
];
