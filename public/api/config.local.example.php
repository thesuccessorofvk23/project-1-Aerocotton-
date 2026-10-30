<?php

/**
 * Aero Cotton — LOCAL DEMO template.
 *
 *     cp public/api/config.local.example.php public/api/config.php
 *
 * While this is in place the endpoint will not deliver to a person. It refuses
 * anything except a loopback SMTP server and a recipient at a reserved test
 * domain, so a mistake in a demo cannot reach a real mailbox — the gate is in
 * lib/mailmode.php, not in this file's comments.
 *
 * Start the capture server and the PHP host with:
 *
 *     npm run mail:start        # Mailpit: SMTP 127.0.0.1:1025, inbox on :8025
 *     npm run api:start         # PHP on 127.0.0.1:8787, serving public/
 *
 * Read captured messages at http://127.0.0.1:8025. Nothing here needs to be
 * secret: every address below is a reserved, unroutable test name (RFC 2606).
 *
 * @return array<string, mixed>
 */

return [
    'env' => 'development',

    // The state that decides everything below.
    'mail_mode' => 'local',

    // Where captured mail is addressed. `.test` can never belong to a person.
    'mail_local_inbox' => 'dev@aerocotton.test',
    'mail_local_from' => 'website@aerocotton.test',

    // Blank means 127.0.0.1:1025, plaintext, no authentication — which is what
    // Mailpit offers. Any other host is refused in this mode.
    // The environment-variable spelling of 'smtp_secure' is AERO_SMTP_ENCRYPTION.
    'smtp_host' => '',
    'smtp_port' => 0,
    'smtp_secure' => '',
    'smtp_user' => '',
    'smtp_pass' => '',

    'from_name' => 'Aerocotton Website',
    'brand' => 'Aerocotton',

    // The dev origins the forms are served from.
    'allowed_origins' => [
        'http://localhost:4181',
        'http://127.0.0.1:4181',
        'http://localhost:4201',
        'http://127.0.0.1:4201',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],

    // Nothing here is throttled: a demo run submits the form many times.
    'rate_limit_max' => 1000,
    'daily_limit' => 1000,

    // Unlocks /api/health.php locally. Development only, and not a secret that
    // matters — it never leaves this machine.
    'health_token' => 'local-demo',

    'debug' => false,
];
