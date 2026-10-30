<?php

declare(strict_types=1);

/**
 * Aero Cotton — the three delivery states, and the gates between them.
 *
 * The endpoint never picks a recipient on its own. Every send goes through
 * aero_mail_plan(), which decides — from configuration alone — who may receive
 * mail right now, and refuses outright when the answer is not safe:
 *
 *   local       capture into a local SMTP server. The recipient must be at a
 *               reserved test domain and the server must be on loopback, so a
 *               demo cannot reach a person even if it is misconfigured.
 *   sample      send to the client's reviewer. Needs `mail_sample_approved`.
 *   production  send to the live recipient. Needs `mail_production_approved`
 *               *and* a complete mailbox configuration.
 *
 * Approval is never inferred. Not from a successful SMTP login, not from having
 * just sent a sample, not from the mode's own name — only from the flag the
 * operator writes down.
 *
 * This file is also what health.php reports, so an operator can see which state
 * the server is in without guessing.
 */

if (!defined('AERO_API')) {
    http_response_code(404);
    exit;
}

/** Resolve the keys a mode owns into one flat view of what will happen. */
function aero_mail_plan(array $config): array
{
    $mode = strtolower(trim((string) ($config['mail_mode'] ?? 'local')));
    $env = trim((string) ($config['env'] ?? 'development'));
    $problems = [];
    $warnings = [];

    if (!in_array($mode, AERO_MAIL_MODES, true)) {
        return aero_mail_plan_blocked($mode, $env, [
            sprintf(
                'AERO_MAIL_MODE is "%s"; it must be one of: %s.',
                $mode === '' ? '(empty)' : $mode,
                implode(', ', AERO_MAIL_MODES)
            ),
        ]);
    }

    /* ── The mailbox ──────────────────────────────────────────────────────
     * Local capture has a sane default (the local SMTP server); the two real
     * states have none, because the provider has to confirm it.
     */
    $host = trim((string) ($config['smtp_host'] ?? ''));
    $port = (int) ($config['smtp_port'] ?? 0);
    $secure = strtolower(trim((string) ($config['smtp_secure'] ?? '')));

    if ($mode === 'local') {
        if ($host === '') {
            $host = '127.0.0.1';
        }
        if ($port === 0) {
            $port = 1025;
        }
    } else {
        if ($host === '') {
            $problems[] = 'smtp_host is not configured: the mailbox provider has to confirm it.';
        }
        if ($port === 0) {
            $port = 587;
        }
    }

    $isLoopback = aero_host_is_loopback($host);

    // The test suite's escape hatch, and nothing else's: it has to be asked for
    // explicitly, and health.php reports it whenever it is on.
    $allowLoopbackRelay = ($config['mail_allow_loopback_relay'] ?? false) === true;
    if ($allowLoopbackRelay) {
        $warnings[] = 'mail_allow_loopback_relay is set: real delivery is being exercised against a local relay. Remove it on any host that can reach the internet.';
    }

    $relayToLoopback = $allowLoopbackRelay && $isLoopback;

    if ($secure === '' && $mode !== 'local' && !$relayToLoopback) {
        $secure = match ($port) {
            587 => 'tls',
            465 => 'ssl',
            default => '',
        };
        if ($secure === '') {
            $problems[] = sprintf('Port %d has no encryption mode set: use AERO_SMTP_ENCRYPTION=tls or ssl.', $port);
        }
    }

    if (!in_array($secure, ['', 'tls', 'ssl'], true)) {
        $problems[] = sprintf('smtp_secure is "%s"; it must be tls, ssl or empty.', $secure);
    }

    $user = trim((string) ($config['smtp_user'] ?? ''));
    $hasPassword = trim((string) ($config['smtp_pass'] ?? '')) !== '';

    /* ── Who receives it ──────────────────────────────────────────────────
     * `to_email` / AERO_MAIL_TO overrides the mode's own inbox. That override
     * is what the tests use, and it is still fenced in by the safety rules
     * below.
     */
    $override = trim((string) ($config['to_email'] ?? ''));
    $inbox = aero_mode_inbox($config, $mode);
    $to = $override !== '' ? $override : $inbox;

    $from = trim((string) ($config['from_email'] ?? ''));
    if ($from === '') {
        $from = aero_mode_from($config, $mode);
    }
    if ($from === '') {
        $from = $user;
    }

    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        $problems[] = $to === ''
            ? 'No recipient address is configured for this mail mode.'
            : 'The configured recipient is not a valid address.';
    }

    /* ── The gates ───────────────────────────────────────────────────────*/

    if ($mode === 'local') {
        if (!aero_host_is_loopback($host)) {
            $problems[] = sprintf(
                'Local capture mode is pointed at %s, which is not this machine. A local demo may only deliver to a local SMTP server.',
                $host
            );
        }
        if (!aero_address_is_reserved_for_testing($to)) {
            $problems[] = sprintf(
                'Local capture mode would deliver to %s, which is not a reserved test address. A local demo may not reach a real mailbox.',
                $to
            );
        }
    } else {
        if ($isLoopback && !$relayToLoopback) {
            $problems[] = 'A real send is pointed at a loopback SMTP host. Set mail_allow_loopback_relay only to test against a local capture server.';
        }
        if ($user === '') {
            $problems[] = 'smtp_user is not configured.';
        }
        if (!$hasPassword) {
            $problems[] = 'smtp_pass is not configured.';
        }
        if (!filter_var($from, FILTER_VALIDATE_EMAIL)) {
            $problems[] = 'No valid sending address is configured (set AERO_MAIL_FROM or smtp_user).';
        }
    }

    if ($mode === 'sample' && ($config['mail_sample_approved'] ?? false) !== true) {
        $problems[] = 'Sample review is not authorised yet: set mail_sample_approved (AERO_MAIL_SAMPLE_APPROVED=1) to send the review copy.';
    }

    if ($mode === 'production' && ($config['mail_production_approved'] ?? false) !== true) {
        $problems[] = 'Production delivery is not authorised: set mail_production_approved (AERO_MAIL_PRODUCTION_APPROVED=1) only once the sample has been approved.';
    }

    if ($problems !== []) {
        return aero_mail_plan_blocked($mode, $env, $problems, $to, $from, $warnings);
    }

    /* ── Approved: build the effective view ──────────────────────────────*/

    $effective = $config;
    $effective['smtp_host'] = $host;
    $effective['smtp_port'] = $port;
    $effective['smtp_secure'] = $secure;
    $effective['from_email'] = $from;

    return [
        'ok' => true,
        'mode' => $mode,
        'env' => $env,
        'to' => $to,
        'from' => $from,
        // In the demo states every message — the notification and the
        // acknowledgement — goes to the one inbox, so a reviewer sees both
        // halves of the exchange and no real visitor is ever written to.
        'redirect_acknowledgement' => $mode !== 'production',
        'subject_prefix' => match ($mode) {
            'local' => '[LOCAL CAPTURE] ',
            'sample' => '[SAMPLE FOR REVIEW] ',
            default => '',
        },
        'notice_html' => aero_mode_notice($mode, $to, true),
        'notice_text' => aero_mode_notice($mode, $to, false),
        'config' => $effective,
        'smtp' => [
            'host' => $host,
            'port' => $port,
            'encryption' => $secure === '' ? 'none' : $secure,
            'user' => $user,
            'password_set' => $hasPassword,
            'timeout' => (int) ($config['smtp_timeout'] ?? 30),
        ],
        'problems' => [],
        'warnings' => $warnings,
        'message' => '',
    ];
}

/** The refusal shape. The visitor never sees the problems — only the log does. */
function aero_mail_plan_blocked(
    string $mode,
    string $env,
    array $problems,
    string $to = '',
    string $from = '',
    array $warnings = []
): array {
    return [
        'ok' => false,
        'mode' => $mode,
        'env' => $env,
        'to' => $to,
        'from' => $from,
        'redirect_acknowledgement' => true,
        'subject_prefix' => '',
        'notice_html' => '',
        'notice_text' => '',
        'config' => [],
        'smtp' => [],
        'problems' => $problems,
        'warnings' => $warnings,
        'message' => 'The enquiry service on this server is not ready to send mail yet, so your request was not delivered. Please email us directly and we will pick it up.',
    ];
}

/** A machine-readable summary for health.php. Secrets are reduced to presence. */
function aero_mail_plan_summary(array $plan): array
{
    return [
        'mode' => $plan['mode'],
        'env' => $plan['env'],
        'delivery_enabled' => (bool) $plan['ok'],
        'recipient' => $plan['to'],
        'sender' => $plan['from'],
        'smtp' => $plan['smtp'],
        'problems' => $plan['problems'],
        'warnings' => $plan['warnings'] ?? [],
    ];
}

/** The recipient a mode owns, before any explicit override. */
function aero_mode_inbox(array $config, string $mode): string
{
    return trim((string) match ($mode) {
        'sample' => $config['mail_sample_inbox'] ?? '',
        'production' => $config['mail_production_inbox'] ?? '',
        default => $config['mail_local_inbox'] ?? '',
    });
}

/** The sender a mode owns, before falling back to the authenticated mailbox. */
function aero_mode_from(array $config, string $mode): string
{
    return trim((string) match ($mode) {
        'sample' => $config['mail_sample_from'] ?? '',
        'production' => $config['mail_production_from'] ?? '',
        default => $config['mail_local_from'] ?? '',
    });
}

/** True for addresses that can never belong to a real person (RFC 2606/6761). */
function aero_address_is_reserved_for_testing(string $email): bool
{
    $at = strrchr($email, '@');
    if ($at === false) {
        return false;
    }
    $domain = strtolower(substr($at, 1));

    // Suffixes, so ".test" covers aerocotton.test and dev.aerocotton.test but
    // not "nottest" — a bare substring match would wave real domains through.
    foreach (['.test', '.invalid', '.example', '.localhost'] as $suffix) {
        if (str_ends_with($domain, $suffix) || $domain === ltrim($suffix, '.')) {
            return true;
        }
    }

    return in_array($domain, ['example.com', 'example.org', 'example.net', 'localhost.localdomain'], true);
}

/** True when the host resolves to this machine by name or by address. */
function aero_host_is_loopback(string $host): bool
{
    $host = strtolower(trim($host, '[]'));
    if (in_array($host, ['localhost', '127.0.0.1', '::1', 'localhost.localdomain'], true)) {
        return true;
    }
    return preg_match('/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/', $host) === 1;
}

/**
 * The banner that makes a demo or review copy unmistakably not a live enquiry.
 * Returned as HTML and as plain text so both MIME parts carry it.
 */
function aero_mode_notice(string $mode, string $to, bool $html): string
{
    if ($mode === 'local') {
        $lines = [
            'LOCAL CAPTURE — NOT SENT TO ANYONE',
            'This message was produced by the enquiry endpoint during local development and handed to the local SMTP capture server. It was not sent to a real recipient.',
        ];
    } elseif ($mode === 'sample') {
        $lines = [
            'SAMPLE FOR REVIEW — NOT A REAL ENQUIRY',
            'This is exactly what a live enquiry notification will look like: same subject, sender, Reply-To and layout. The details inside it are placeholders.',
            'It has been delivered to the reviewer only (' . $to . '). Live delivery to the company inbox stays switched off until this sample is approved.',
        ];
    } else {
        return '';
    }

    if (!$html) {
        $rule = str_repeat('-', 68);
        return $rule . "\n" . implode("\n", $lines) . "\n" . $rule . "\n\n";
    }

    $body = '';
    foreach ($lines as $i => $line) {
        $weight = $i === 0 ? 'bold' : 'normal';
        $size = $i === 0 ? '12px' : '13px';
        $body .= '<p style="margin:' . ($i === 0 ? '0' : '8px 0 0') . ';font-family:Helvetica,Arial,sans-serif;font-size:' . $size . ';line-height:1.6;font-weight:' . $weight . ';color:#7a3b12;">'
            . htmlspecialchars($line, ENT_QUOTES, 'UTF-8') . '</p>';
    }

    return '<div style="max-width:640px;margin:0 auto 14px;padding:16px 20px;background:#fdf3e3;border:1px solid #e0b877;">'
        . $body . '</div>';
}

/**
 * Stamp a generated message with the plan: the prefix, the notice banner, and
 * nothing else. Recipients are set by the caller so each one can be pointed at
 * the right inbox.
 */
function aero_apply_mail_plan(array $message, array $plan): array
{
    $prefix = (string) ($plan['subject_prefix'] ?? '');
    if ($prefix !== '') {
        $message['subject'] = $prefix . (string) ($message['subject'] ?? '');
    }

    $notice = (string) ($plan['notice_html'] ?? '');
    if ($notice !== '' && isset($message['html'])) {
        $message['html'] = $notice . (string) $message['html'];
    }

    $noticeText = (string) ($plan['notice_text'] ?? '');
    if ($noticeText !== '' && isset($message['text'])) {
        $message['text'] = $noticeText . (string) $message['text'];
    }

    return $message;
}
