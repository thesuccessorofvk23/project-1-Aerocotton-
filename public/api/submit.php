<?php

declare(strict_types=1);

/**
 * Aero Cotton — the one endpoint both public forms post to.
 *
 *     POST /api/submit.php?form=contact      the Contact Us enquiry
 *     POST /api/submit.php?form=support      the Request Support form
 *
 * The form name may also travel in the body as "form". Both accept JSON or
 * multipart/form-data (the latter when files are attached).
 *
 * Nothing here is a simulation: an accepted submission is handed to the
 * mailbox over authenticated SMTP, and the visitor is told success only after
 * the mail server has accepted the message. If delivery fails the request is
 * logged in full server-side and the visitor is asked to retry — never shown a
 * false confirmation.
 *
 * Credentials live in public/api/config.php (git-ignored, denied by .htaccess)
 * or in AERO_* environment variables. They are never sent to the browser.
 */

define('AERO_API', true);

// A PHP notice inside a JSON body would break the form's error handling.
@ini_set('display_errors', '0');
@ini_set('log_errors', '1');

require __DIR__ . '/lib/config.php';
require __DIR__ . '/lib/guard.php';
require __DIR__ . '/lib/request.php';
require __DIR__ . '/lib/uploads.php';
require __DIR__ . '/lib/mailer.php';
require __DIR__ . '/lib/forms.php';

$config = aero_config();

aero_cors($config);

/* ── Method ────────────────────────────────────────────────────────────── */

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($method !== 'POST') {
    header('Allow: POST, OPTIONS');
    aero_fail(405, 'This endpoint accepts POST requests only.');
}

/* ── Origin ────────────────────────────────────────────────────────────── */

if (!aero_origin_allowed($config)) {
    aero_log($config, 'origin_rejected', ['origin' => (string) ($_SERVER['HTTP_ORIGIN'] ?? '')]);
    aero_fail(403, 'This form is not available from that address.');
}

/* ── Body ──────────────────────────────────────────────────────────────── */

$parsed = aero_read_request();

if ($parsed['error'] !== null) {
    aero_log($config, 'bad_request', ['reason' => $parsed['error']]);
    aero_fail(
        $parsed['error'] === 'malformed-json' ? 400 : 413,
        match ($parsed['error']) {
            'upload-too-large' => 'Your files are larger than this server accepts. Please attach smaller files, or send them to us by email.',
            'body-too-large' => 'That submission was too large. Please reduce it and try again.',
            default => 'We could not read that submission. Please try again.',
        }
    );
}

$input = $parsed['input'];
$form = is_string($input['form'] ?? null) ? (string) $input['form'] : '';

if (!in_array($form, ['contact', 'support'], true)) {
    aero_fail(400, 'We could not tell which form that was. Please reload the page and try again.');
}

/* ── Bot traps ─────────────────────────────────────────────────────────── *
 * Two cheap signals, both invisible to a person: a field no human can see,
 * and a submission completed faster than anyone can type. A bot that trips
 * either gets an ordinary success with a reference number and no email — a
 * distinguishable answer would only tell it what to fix.
 */

$honeypot = trim((string) ($input['website'] ?? ''));
$elapsed = is_numeric($input['elapsed'] ?? null) ? (int) $input['elapsed'] : 0;

if ($honeypot !== '' || ($elapsed > 0 && $elapsed < 2500)) {
    aero_log($config, 'bot_discarded', [
        'form' => $form,
        'honeypot' => $honeypot !== '',
        'too_quick' => $honeypot === '',
        'ip' => aero_client_ip(),
    ]);
    aero_json(200, [
        'ok' => true,
        'reference' => aero_reference($config),
        'message' => 'Thank you. Your request has been successfully submitted. Our team will review it and get back to you shortly.',
    ]);
}

/* ── CAPTCHA, when configured ──────────────────────────────────────────── */

if (!aero_turnstile_ok($config, (string) ($input['turnstileToken'] ?? ''))) {
    aero_log($config, 'turnstile_rejected', ['form' => $form, 'ip' => aero_client_ip()]);
    aero_fail(403, 'We could not confirm you are a person. Please reload the page and try again.');
}

/* ── Rate limit ────────────────────────────────────────────────────────── */

$limit = aero_rate_limit($config);

if (!$limit['ok']) {
    aero_log($config, 'rate_limited', [
        'form' => $form,
        'reason' => (string) ($limit['reason'] ?? 'window'),
        'ip' => aero_client_ip(),
    ]);

    $retry = (int) ($limit['retry_after'] ?? 0);
    aero_fail(
        429,
        $retry > 0
            ? sprintf('You have sent several requests already. Please try again in about %d minute%s, or reply to any email from us.', $retry, $retry === 1 ? '' : 's')
            : 'We have received a lot of requests today. Please try again tomorrow, or reply to any email from us.',
        $retry > 0 ? ['retryAfterMinutes' => $retry] : []
    );
}

/* ── Server-side validation (the authority) ────────────────────────────── */

$validated = aero_validate($form, $input);

if ($validated['errors'] !== []) {
    aero_fail(422, 'Please check the highlighted fields and try again.', ['errors' => $validated['errors']]);
}

$data = $validated['data'];

/* ── Attachments ───────────────────────────────────────────────────────── */

$uploads = aero_collect_uploads($parsed['files'], $config);

if ($uploads['errors'] !== []) {
    aero_fail(422, 'Please check your attachments and try again.', [
        'errors' => ['files' => implode(' ', $uploads['errors'])],
    ]);
}

/* ── Delivery ──────────────────────────────────────────────────────────── */

$now = aero_now();
$reference = aero_reference($config);

$notification = aero_build_notification($form, $data, $now, $reference, $config);
$notification['reply_to'] = (string) ($data['email'] ?? '');
$notification['attachments'] = $uploads['attachments'];

$mailer = new AeroMailer($config);
$sent = $mailer->send($notification);

if (!$sent['ok']) {
    // The enquiry is recorded in full so a delivery problem never loses a
    // lead, and the SMTP conversation is kept with credentials masked.
    aero_log($config, 'delivery_failed', [
        'form' => $form,
        'reference' => $reference,
        'ip' => aero_client_ip(),
        'error' => (string) ($sent['error'] ?? 'unknown'),
        'attachments' => array_map(static fn (array $f): string => $f['name'], $uploads['attachments']),
        'submission' => $data,
        'transcript' => aero_mask_secrets($mailer->transcript(), $config),
    ]);

    aero_fail(
        502,
        'We could not deliver your request just now. Nothing has been lost — our team has been alerted and will be in touch. Please try again in a moment.',
        ['reference' => $reference]
    );
}

/* ── Acknowledgement to the visitor (best effort) ──────────────────────── */

$visitor = (string) ($data['email'] ?? '');
$acknowledged = false;

if ($visitor !== '' && strcasecmp($visitor, (string) $config['to_email']) !== 0) {
    $confirmation = aero_build_confirmation($form, $data, $now, $reference, $config);
    $confirmation['to'] = $visitor;

    $result = $mailer->send($confirmation);
    $acknowledged = $result['ok'];

    if (!$acknowledged) {
        aero_log($config, 'confirmation_failed', [
            'reference' => $reference,
            'error' => (string) ($result['error'] ?? 'unknown'),
        ]);
    }
}

aero_log($config, 'sent', [
    'form' => $form,
    'reference' => $reference,
    'ip' => aero_client_ip(),
    'attachments' => count($uploads['attachments']),
    'acknowledged' => $acknowledged,
]);

aero_json(200, [
    'ok' => true,
    'reference' => $reference,
    'acknowledged' => $acknowledged,
    'submittedAt' => $now['human'],
    'message' => 'Thank you. Your request has been successfully submitted. Our team will review it and get back to you shortly.',
]);
