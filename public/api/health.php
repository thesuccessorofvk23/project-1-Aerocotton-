<?php

declare(strict_types=1);

/**
 * Aero Cotton — mail endpoint health check.
 *
 *     GET /api/health.php?token=<health_token>
 *     GET /api/health.php?token=<health_token>&probe=1
 *
 * Answers the questions you cannot answer from the outside on shared hosting:
 * is the credentials file being found, does the mailbox accept the password,
 * can the endpoint write its rate-limit and log files, and how large a file
 * will the server actually let a visitor upload.
 *
 * The page never prints a password — only whether one is present and how long
 * it is. It is disabled entirely until health_token is set in config.php, and
 * is deliberately not linked from anywhere on the site.
 */

define('AERO_API', true);

@ini_set('display_errors', '0');

require __DIR__ . '/lib/config.php';
require __DIR__ . '/lib/guard.php';
require __DIR__ . '/lib/request.php';
require __DIR__ . '/lib/mailmode.php';
require __DIR__ . '/lib/mailer.php';

$config = aero_config();
$plan = aero_mail_plan($config);

$token = (string) ($_GET['token'] ?? '');
$expected = (string) ($config['health_token'] ?? '');

// No token configured, or the wrong one: pretend this file does not exist.
if ($expected === '' || $token === '' || !hash_equals($expected, $token)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    exit("Not Found\n");
}

/** Presence and shape of a secret, never the value. */
$secretState = static function (string $value): array {
    return [
        'set' => $value !== '',
        'length' => strlen($value),
    ];
};

$configFile = null;
// This file lives in `api/`, one level above `lib/config.php`, so the folder
// holding the site root is TWO levels up from here, not three: three would look
// one directory above the vhost and report "defaults" while a real config file
// was loaded all along.
foreach ([__DIR__ . '/config.php', dirname(__DIR__, 2) . '/aero-config.php'] as $candidate) {
    if (is_file($candidate)) {
        $configFile = $candidate;
        break;
    }
}

$phpIni = static fn (string $key): string => (string) ini_get($key);

$report = [
    'endpoint' => [
        'php' => PHP_VERSION,
        'sapi' => PHP_SAPI,
        'extensions' => [
            'openssl' => extension_loaded('openssl'),
            'mbstring' => extension_loaded('mbstring'),
            'fileinfo' => extension_loaded('fileinfo'),
            'json' => extension_loaded('json'),
        ],
    ],
    'mail' => aero_mail_plan_summary($plan),
    'config' => [
        'file_found' => $configFile,
        'source' => aero_env('AERO_CONFIG_FILE') !== null ? 'AERO_CONFIG_FILE' : ($configFile !== null ? 'config file' : 'defaults'),
        'env' => $config['env'],
        'mail_mode' => $config['mail_mode'],
        'brand' => $config['brand'],
        'smtp_user' => $config['smtp_user'] === '' ? '(empty)' : $config['smtp_user'],
        'smtp_pass' => $secretState((string) $config['smtp_pass']),
        'allowed_origins' => $config['allowed_origins'],
        'turnstile' => $secretState((string) $config['turnstile_secret']),
        'health_token' => $secretState((string) $config['health_token']),
        'debug' => (bool) $config['debug'],
    ],
    'storage' => [
        'data_dir' => $config['data_dir'],
        'data_writable' => aero_private_dir((string) $config['data_dir']),
        'log_file' => $config['log_file'],
        'logs_writable' => aero_private_dir(dirname((string) $config['log_file'])),
    ],
    'uploads' => [
        'allowed' => (bool) $config['allow_uploads'],
        'max_file_bytes' => (int) $config['max_upload_bytes'],
        'max_files' => (int) $config['max_upload_files'],
        'max_total_bytes' => (int) $config['max_upload_total'],
        'accepted_types' => $config['allowed_upload_types'],
        'php_upload_max_filesize' => $phpIni('upload_max_filesize'),
        'php_post_max_size' => $phpIni('post_max_size'),
    ],
];

$problems = [];
if (!extension_loaded('openssl')) {
    $problems[] = 'The openssl extension is missing: TLS to the mail server is impossible.';
}
if (!aero_private_dir((string) $config['data_dir'])) {
    $problems[] = 'The data directory is not writable: rate limiting is skipped and reference numbers fall back to random.';
}

// Everything the mail-mode gate refused, verbatim. This is the one place an
// operator can see why the endpoint is not delivering.
foreach ($plan['problems'] as $problem) {
    $problems[] = '[' . $plan['mode'] . ' mode] ' . $problem;
}

// Optional live check of the mailbox. Connectivity, TLS and authentication are
// one exchange, so they are reported as one probe — but never as delivery.
$probe = null;
if ((string) ($_GET['probe'] ?? '') !== '') {
    if (!$plan['ok']) {
        $probe = [
            'attempted' => false,
            'error' => 'Not attempted: the mail-mode gate refused before connecting.',
            'transcript' => [],
        ];
    } else {
        $mailer = new AeroMailer($plan['config']);
        $result = $mailer->probe();
        $transcript = aero_mask_secrets($mailer->transcript(), $config);
        $error = (string) ($result['error'] ?? '');

        // A hint, not a diagnosis: the SMTP client reports the failure as one
        // string, so this only says which stage it most likely stopped at.
        $stage = 'connected';
        if (preg_match('/Cannot reach/i', $error) === 1 || $error === '') {
            $stage = 'connection';
        } elseif (preg_match('/TLS|STARTTLS/i', $error) === 1) {
            $stage = 'tls';
        } elseif (preg_match('/AUTH|535|534|530/i', $error) === 1) {
            $stage = 'authentication';
        }

        $probe = [
            'attempted' => true,
            'ok' => $result['ok'],
            'error' => $result['error'] ?? null,
            'stopped_at' => $result['ok'] ? 'authenticated' : $stage,
            'transcript' => $transcript,
        ];
        if (!$result['ok']) {
            $problems[] = 'The SMTP probe failed: ' . $error;
        }
    }
}

/**
 * What has and has not been established, in the order the states actually
 * occur. Nothing here is inferred from anything else: `acceptance` is only ever
 * true after a message has been handed to SMTP, and `inbox_delivery` is never
 * claimed by this endpoint at all.
 */
$checks = [
    'configuration' => [
        'ok' => $plan['ok'],
        'detail' => $plan['ok'] ? 'The mail configuration for ' . $plan['mode'] . ' mode is complete.' : 'Incomplete: see problems.',
    ],
    'connectivity' => [
        'ok' => $probe === null ? null : ($probe['attempted'] === true && ($probe['stopped_at'] ?? '') !== 'connection'),
        'detail' => $probe === null ? 'Not checked: add &probe=1 (opens a connection to the mail server).' : 'See probe.',
    ],
    'authentication' => [
        'ok' => $probe === null ? null : (($probe['ok'] ?? false) === true),
        'detail' => $probe === null ? 'Not checked: add &probe=1.' : 'See probe.',
    ],
    'message_acceptance' => [
        'ok' => null,
        'detail' => 'Not attempted: this endpoint never sends mail from the health check.',
    ],
    'inbox_delivery' => [
        'ok' => null,
        'detail' => 'Cannot be observed from here. SMTP acceptance is not proof of arrival; check the recipient mailbox.',
    ],
];

aero_json(200, [
    'ok' => $problems === [],
    'problems' => $problems,
    // Not failures: things that are acceptable while testing and must not be
    // left in place on a live host.
    'warnings' => $plan['warnings'] ?? [],
    'checks' => $checks,
    'report' => $report,
    'probe' => $probe,
]);
