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
require __DIR__ . '/lib/mailer.php';

$config = aero_config();

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
foreach ([__DIR__ . '/config.php', dirname(__DIR__, 3) . '/aero-config.php'] as $candidate) {
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
    'config' => [
        'file_found' => $configFile,
        'source' => aero_env('AERO_CONFIG_FILE') !== null ? 'AERO_CONFIG_FILE' : ($configFile !== null ? 'config file' : 'defaults'),
        'to_email' => $config['to_email'],
        'brand' => $config['brand'],
        'smtp' => $config['smtp_host'] . ':' . $config['smtp_port'] . ' (' . ($config['smtp_secure'] ?: 'plain') . ')',
        'smtp_user' => $config['smtp_user'] === '' ? '(empty)' : $config['smtp_user'],
        'smtp_pass' => $secretState((string) $config['smtp_pass']),
        'from_email' => $config['from_email'],
        'allowed_origins' => $config['allowed_origins'],
        'turnstile' => $secretState((string) $config['turnstile_secret']),
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
if ((string) $config['smtp_pass'] === '') {
    $problems[] = 'smtp_pass is empty — copy config.example.php to config.php and fill it in.';
}
if ((string) $config['smtp_user'] === '') {
    $problems[] = 'smtp_user is empty.';
}
if (!filter_var((string) $config['to_email'], FILTER_VALIDATE_EMAIL)) {
    $problems[] = 'to_email is not a valid address.';
}
if (!aero_private_dir((string) $config['data_dir'])) {
    $problems[] = 'The data directory is not writable: rate limiting is skipped and reference numbers fall back to random.';
}

// Optional live check of the mailbox.
$probe = null;
if ((string) ($_GET['probe'] ?? '') !== '') {
    $mailer = new AeroMailer($config);
    $result = $mailer->probe();
    $probe = [
        'ok' => $result['ok'],
        'error' => $result['error'] ?? null,
        'transcript' => aero_mask_secrets($mailer->transcript(), $config),
    ];
    if (!$result['ok']) {
        $problems[] = 'The SMTP probe failed: ' . (string) ($result['error'] ?? 'unknown');
    }
}

aero_json(200, [
    'ok' => $problems === [],
    'problems' => $problems,
    'report' => $report,
    'probe' => $probe,
]);
