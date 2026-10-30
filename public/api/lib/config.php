<?php

declare(strict_types=1);

/**
 * Aero Cotton — mail endpoint configuration.
 *
 * Three layers, lowest to highest precedence:
 *
 *   1. the safe defaults in this file
 *   2. a PHP file returning a partial array — `public/api/config.php`,
 *      `aero-config.php` beside the folder that holds the site (i.e. above the
 *      web root), or whatever `AERO_CONFIG_FILE` points at
 *   3. environment variables
 *
 * Environment variables come in two spellings and both work:
 *
 *   canonical  AERO_ENV  AERO_MAIL_MODE  AERO_SMTP_HOST  AERO_SMTP_PORT
 *              AERO_SMTP_ENCRYPTION  AERO_SMTP_USER  AERO_SMTP_PASS
 *              AERO_MAIL_FROM  AERO_MAIL_TO  AERO_HEALTH_TOKEN
 *   generic    AERO_<CONFIG_KEY> in capitals, e.g. AERO_TO_EMAIL,
 *              AERO_ALLOWED_ORIGINS, AERO_RATE_LIMIT_MAX
 *
 * No credential or provider detail is committed. `smtp_host`, `smtp_port`,
 * `smtp_secure`, `smtp_user` and `smtp_pass` are all deliberately blank here:
 * the mailbox provider has to confirm them, and a plausible-looking guess that
 * happens to be wrong is worse than a blank that the operator must fill in.
 * lib/mailmode.php refuses to send until they are.
 *
 * Nothing in this file is sent to the browser.
 */

if (!defined('AERO_API')) {
    http_response_code(404);
    exit;
}

/** The three delivery states. See lib/mailmode.php for what each one allows. */
const AERO_MAIL_MODES = ['local', 'sample', 'production'];

/** Read a non-empty environment variable, or null. */
function aero_env(string $key): ?string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        return null;
    }
    return $value;
}

/** Split a comma-separated env value into a trimmed list. */
function aero_env_list(string $key): ?array
{
    $raw = aero_env($key);
    if ($raw === null) {
        return null;
    }
    return array_values(array_filter(array_map('trim', explode(',', $raw)), static fn ($v) => $v !== ''));
}

/** Read a boolean environment variable, or null when it is not set. */
function aero_env_bool(string $key): ?bool
{
    $raw = aero_env($key);
    if ($raw === null) {
        return null;
    }
    return in_array(strtolower(trim($raw)), ['1', 'true', 'yes', 'on'], true);
}

/**
 * Canonical environment names, mapped onto the key they set.
 *
 * `AERO_SMTP_HOST` and friends already resolve through the generic rule; these
 * are the names the deployment documentation and Plesk panel actually use, and
 * the three that differ from the config key are the reason this table exists.
 */
function aero_env_aliases(): array
{
    return [
        'AERO_ENV' => 'env',
        'AERO_MAIL_MODE' => 'mail_mode',
        'AERO_SMTP_ENCRYPTION' => 'smtp_secure',
        'AERO_MAIL_FROM' => 'from_email',
        'AERO_MAIL_TO' => 'to_email',
    ];
}

function aero_config(): array
{
    $defaults = [
        /* ── Which state the endpoint is in ─────────────────────────────── */

        // A free-form label for this installation: development | staging |
        // production. Reported by health.php; it does not by itself change
        // routing — `mail_mode` does that.
        'env' => 'development',

        // local      capture into a local SMTP server, never a real mailbox
        // sample     send to the client's reviewer for approval
        // production send to the live recipient
        'mail_mode' => 'local',

        // Who each state delivers to. `to_email` / AERO_MAIL_TO overrides the
        // one for the active mode, which is what the tests use.
        'mail_local_inbox' => 'dev@aerocotton.test',
        'mail_sample_inbox' => 'jeinfonet@gmail.com',
        'mail_production_inbox' => 'export@aerocotton.in',

        // Every real send needs its own recorded approval. Neither flag is
        // inferred from anything: not from successful SMTP authentication, and
        // not from having just sent a sample.
        'mail_sample_approved' => false,
        'mail_production_approved' => false,

        // Test-suite only. It relaxes exactly two checks — that a real send is
        // not aimed at a loopback host, and that the connection is encrypted —
        // so the sample and production routing can be exercised end to end
        // against a local capture server. The approval flags and the mailbox
        // credentials are still required, and health.php reports it loudly.
        // Never set it on a host that can reach the internet.
        'mail_allow_loopback_relay' => false,

        // The From: address per state. Blank means "use smtp_user", which is
        // the mailbox the domain's SPF and DKIM records cover.
        'mail_local_from' => 'website@aerocotton.test',
        'mail_sample_from' => 'admin@aerocotton.in',
        'mail_production_from' => '',

        /* ── The mailbox ────────────────────────────────────────────────── */

        // Confirmed with the mail provider — never guessed. In `local` mode
        // these resolve to 127.0.0.1:1025 when left blank.
        'smtp_host' => '',
        'smtp_port' => 0,
        // 'tls' = STARTTLS, 'ssl' = implicit TLS, '' = plain (local capture
        // only). Blank with port 587 resolves to 'tls', with 465 to 'ssl';
        // any other port with no encryption set is refused.
        'smtp_secure' => '',
        'smtp_user' => '',
        'smtp_pass' => '',
        'smtp_timeout' => 30,

        // Explicit override of the active mode's From: address.
        'from_email' => '',
        'from_name' => 'Aerocotton Website',

        // Explicit override of the active mode's recipient.
        'to_email' => '',

        /* ── Copy ──────────────────────────────────────────────────────── */

        // The name that appears in notification subject lines.
        'brand' => 'Aerocotton',

        /* ── Who may post ──────────────────────────────────────────────── */

        // The live site plus the local development origins. Never a wildcard.
        'allowed_origins' => [
            'https://aerocotton.in',
            'https://www.aerocotton.in',
            'http://localhost:4181',
            'http://127.0.0.1:4181',
            'http://localhost:4201',
            'http://127.0.0.1:4201',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ],

        /* ── Abuse limits ──────────────────────────────────────────────── */

        'rate_limit_max' => 5,       // submissions per window, per client
        'rate_limit_window' => 600,  // seconds
        'daily_limit' => 60,         // submissions per day, across all clients

        /* ── Attachments ───────────────────────────────────────────────── */

        'allow_uploads' => true,
        'max_upload_bytes' => 4194304, // 4 MiB per file
        'max_upload_files' => 3,
        'max_upload_total' => 6291456, // 6 MiB across all files
        'allowed_upload_types' => [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/heic',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/msword',
            'text/csv',
            'text/plain',
        ],

        /* ── Optional bot protection ───────────────────────────────────── */

        'turnstile_secret' => '',

        /* ── Diagnostics ───────────────────────────────────────────────── */

        // Unlocks /api/health.php. Empty means the page reports 404.
        'health_token' => '',

        'data_dir' => dirname(__DIR__) . '/data',
        'log_file' => dirname(__DIR__) . '/logs/submissions.log',
        'debug' => false,
    ];

    /* 2. a config file, if one is present */
    $candidates = array_filter([
        aero_env('AERO_CONFIG_FILE'),
        dirname(__DIR__) . '/config.php',          // public/api/config.php
        dirname(__DIR__, 3) . '/aero-config.php',  // beside the folder holding the site root
    ]);

    foreach ($candidates as $path) {
        if (!is_file($path)) {
            continue;
        }
        $loaded = require $path;
        if (is_array($loaded)) {
            $defaults = array_merge($defaults, $loaded);
        }
        break;
    }

    /* 1. environment variables win */
    foreach ($defaults as $key => $value) {
        $envKey = 'AERO_' . strtoupper($key);
        if ($key === 'allowed_origins') {
            $list = aero_env_list($envKey);
            if ($list !== null) {
                $defaults[$key] = $list;
            }
            continue;
        }
        if (is_bool($value)) {
            $flag = aero_env_bool($envKey);
            if ($flag !== null) {
                $defaults[$key] = $flag;
            }
            continue;
        }
        $raw = aero_env($envKey);
        if ($raw === null) {
            continue;
        }
        $defaults[$key] = is_int($value) ? (int) $raw : $raw;
    }

    /* and the canonical spellings on top of that */
    foreach (aero_env_aliases() as $envKey => $key) {
        $raw = aero_env($envKey);
        if ($raw === null) {
            continue;
        }
        $defaults[$key] = is_bool($defaults[$key])
            ? (bool) aero_env_bool($envKey)
            : (is_int($defaults[$key]) ? (int) $raw : $raw);
    }

    $defaults['mail_mode'] = strtolower(trim((string) $defaults['mail_mode']));

    // Where PHP resolves a relative path depends on the SAPI — the built-in
    // server changes directory to the document root, so `.pdf-work/state`
    // quietly became `public/api/.pdf-work/state`. Anchoring the two runtime
    // paths to the endpoint's own directory makes them behave the same however
    // they were set.
    foreach (['data_dir', 'log_file'] as $key) {
        $candidate = trim((string) $defaults[$key]);
        if ($candidate !== '' && preg_match('#^([A-Za-z]:[\\\\/]|/)#', $candidate) !== 1) {
            $defaults[$key] = dirname(__DIR__) . '/' . ltrim($candidate, './\\');
        }
    }

    return $defaults;
}
