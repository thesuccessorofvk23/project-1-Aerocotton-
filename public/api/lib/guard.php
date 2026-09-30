<?php

declare(strict_types=1);

/**
 * Request guards: origin verification, rate limiting, bot traps, logging.
 */

if (!defined('AERO_API')) {
    http_response_code(404);
    exit;
}

/** The client address, honouring a proxy front-end when one is present. */
function aero_client_ip(): string
{
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP'] as $key) {
        $raw = $_SERVER[$key] ?? '';
        if (is_string($raw) && $raw !== '') {
            $first = trim(explode(',', $raw)[0]);
            if ($first !== '' && filter_var($first, FILTER_VALIDATE_IP)) {
                return $first;
            }
        }
    }
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    return is_string($remote) && $remote !== '' ? $remote : '0.0.0.0';
}

/**
 * Only the site's own origins may post. Same-origin browser requests always
 * carry Origin; requests without one (curl, a server-side caller) are accepted
 * and left to the rate limiter.
 */
function aero_origin_allowed(array $config): bool
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!is_string($origin) || $origin === '') {
        return true;
    }
    return in_array(rtrim($origin, '/'), array_map(static fn ($o) => rtrim((string) $o, '/'), $config['allowed_origins']), true);
}

/** Echo CORS headers only for a known origin (never a wildcard). */
function aero_cors(array $config): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!is_string($origin) || $origin === '') {
        return;
    }
    if (!aero_origin_allowed($config)) {
        return;
    }
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');
}

/** Create a directory that must never be readable over HTTP. */
function aero_private_dir(string $dir): bool
{
    if (!is_dir($dir) && !@mkdir($dir, 0770, true) && !is_dir($dir)) {
        return false;
    }
    $htaccess = rtrim($dir, '/') . '/.htaccess';
    if (!is_file($htaccess)) {
        @file_put_contents(
            $htaccess,
            "# Written by the mail endpoint: keep this directory private.\n" .
            "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n" .
            "<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n"
        );
    }
    return is_writable($dir);
}

/**
 * Sliding-window rate limit, per client and in total, backed by small files so
 * it works on shared hosting without a database or Redis.
 */
function aero_rate_limit(array $config): array
{
    $dir = (string) $config['data_dir'];
    if (!aero_private_dir($dir)) {
        return ['ok' => true, 'skipped' => true];
    }

    $window = max(60, (int) $config['rate_limit_window']);
    $max = max(1, (int) $config['rate_limit_max']);
    $dailyMax = max(1, (int) $config['daily_limit']);
    $now = time();
    $ip = aero_client_ip();
    $bucket = $dir . '/rate-' . substr(hash('sha256', $ip . '|aero'), 0, 32) . '.json';
    $global = $dir . '/rate-global.json';

    $read = static function (string $path): array {
        $raw = @file_get_contents($path);
        if (!is_string($raw) || $raw === '') {
            return [];
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            return [];
        }
        return array_values(array_filter(array_map('intval', $data), static fn ($t) => $t > 0));
    };

    $write = static function (string $path, array $hits): void {
        @file_put_contents($path, json_encode($hits), LOCK_EX);
    };

    $mine = array_values(array_filter($read($bucket), static fn ($t) => $t > $now - $window));
    if (count($mine) >= $max) {
        $oldest = $mine[0] ?? $now;
        return [
            'ok' => false,
            'retry_after' => max(1, (int) ceil(($oldest + $window - $now) / 60)),
            'reason' => 'window',
        ];
    }

    $all = array_values(array_filter($read($global), static fn ($t) => $t > $now - 86400));
    if (count($all) >= $dailyMax) {
        return ['ok' => false, 'reason' => 'daily'];
    }

    $mine[] = $now;
    $all[] = $now;
    $write($bucket, $mine);
    $write($global, $all);

    return ['ok' => true];
}

/**
 * Sequential reference numbers (AH-2026-000123) from a locked counter file,
 * with a random fallback if the data directory is not writable.
 */
function aero_reference(array $config): string
{
    $year = (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format('Y');
    $dir = (string) $config['data_dir'];

    if (aero_private_dir($dir)) {
        $path = $dir . '/counter-' . $year . '.txt';
        $handle = @fopen($path, 'c+');
        if ($handle !== false) {
            try {
                if (flock($handle, LOCK_EX)) {
                    $raw = stream_get_contents($handle);
                    $n = (int) trim((string) $raw) + 1;
                    ftruncate($handle, 0);
                    rewind($handle);
                    fwrite($handle, (string) $n);
                    fflush($handle);
                    flock($handle, LOCK_UN);
                    fclose($handle);
                    return sprintf('AH-%s-%06d', $year, $n);
                }
                fclose($handle);
            } catch (Throwable) {
                // fall through to the random reference below
            }
        }
    }

    try {
        return sprintf('AH-%s-%06d', $year, random_int(100000, 999999));
    } catch (Throwable) {
        return sprintf('AH-%s-%06d', $year, (int) (microtime(true) * 100) % 1000000);
    }
}

/** Append one JSON line to the private log. Never throws, never echoes. */
function aero_log(array $config, string $event, array $context = []): void
{
    $path = (string) $config['log_file'];
    if (!aero_private_dir(dirname($path))) {
        return;
    }
    $line = json_encode(
        ['at' => date('c'), 'event' => $event] + $context,
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );
    @file_put_contents($path, $line . "\n", FILE_APPEND | LOCK_EX);
}

/** Strip control characters and collapse whitespace. */
function aero_clean(string $value): string
{
    $value = str_replace(["\r\n", "\r", "\n", "\t"], ' ', $value);
    $value = preg_replace('/[\x00-\x1F\x7F]/u', '', $value) ?? '';
    $value = preg_replace('/[ \x{00A0}]{2,}/u', ' ', $value) ?? '';
    return trim($value);
}

/**
 * Verify a Cloudflare Turnstile token. Always true when no secret is configured,
 * so the endpoint runs on the honeypot and rate limiter alone until you opt in.
 */
function aero_turnstile_ok(array $config, string $token): bool
{
    $secret = trim((string) ($config['turnstile_secret'] ?? ''));
    if ($secret === '') {
        return true;
    }
    if ($token === '') {
        return false;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => http_build_query([
                'secret' => $secret,
                'response' => $token,
                'remoteip' => aero_client_ip(),
            ]),
            'timeout' => 8,
            'ignore_errors' => true,
        ],
    ]);

    $raw = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $context);
    if (!is_string($raw) || $raw === '') {
        return false;
    }
    $data = json_decode($raw, true);
    return is_array($data) && ($data['success'] ?? false) === true;
}

/**
 * Replace anything that looks like a credential before it reaches the log.
 *
 * @param list<string> $lines
 * @return list<string>
 */
function aero_mask_secrets(array $lines, array $config): array
{
    $secrets = array_filter([
        (string) ($config['smtp_pass'] ?? ''),
        (string) ($config['turnstile_secret'] ?? ''),
        (string) ($config['health_token'] ?? ''),
    ], static fn ($v) => strlen($v) >= 4);

    if ($secrets === []) {
        return $lines;
    }

    $needles = [];
    foreach ($secrets as $secret) {
        $needles[$secret] = '***';
        $needles[base64_encode($secret)] = '***';
    }

    return array_map(
        static fn ($line) => strtr((string) $line, $needles),
        $lines
    );
}

/** Multi-line safe clean-up: keeps newlines for message bodies. */
function aero_clean_multiline(string $value): string
{
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    $value = preg_replace('/\n{4,}/', "\n\n\n", $value) ?? '';
    return trim($value);
}
