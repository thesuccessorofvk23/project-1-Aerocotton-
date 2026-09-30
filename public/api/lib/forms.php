<?php

declare(strict_types=1);

/**
 * The two public forms: their field contracts (the server is the authority on
 * validation) and the emails they produce.
 *
 * The option lists below are mirrored in src/lib/forms/options.ts — if you add
 * an option, add it in both places or the server will reject a valid choice.
 */

if (!defined('AERO_API')) {
    http_response_code(404);
    exit;
}

const AERO_INTEREST_OPTIONS = [
    'General enquiry',
    'Nature collection',
    'Mountain collection',
    'Beach collection',
    'City collection',
    'Forest collection',
    'Lake collection',
    'Desert collection',
    'Waterfall collection',
    'Snow collection',
    'Aurora collection',
    'Custom manufacturing',
    'Private label / OEM',
    'Samples and swatches',
    'Other',
];

const AERO_QUANTITY_OPTIONS = [
    'Sample / swatch request',
    'Under 500 units',
    '500 – 2,000 units',
    '2,000 – 10,000 units',
    '10,000+ units',
];

const AERO_CATEGORY_OPTIONS = [
    'Order status / tracking',
    'Delivery or shipment',
    'Product quality',
    'Returns or replacement',
    'Product or care question',
    'Documentation or billing',
    'Other',
];

const AERO_PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Urgent'];

/**
 * Field specs in the order they appear in the notification email.
 * type: text | email | select | multiline, plus optional allowed values.
 */
function aero_form_specs(): array
{
    return [
        'contact' => [
            'title' => 'New Contact Inquiry',
            'eyebrow' => 'New contact enquiry — aerocotton.in',
            'subject' => 'New Contact Inquiry - {brand}',
            'footer' => 'Reply directly to this email to reach the sender. Submitted from the aerocotton.in contact form.',
            'fields' => [
                'name' => ['label' => 'Name', 'type' => 'text', 'required' => true, 'min' => 2, 'max' => 80],
                'company' => ['label' => 'Company', 'type' => 'text', 'required' => true, 'min' => 2, 'max' => 120],
                'email' => ['label' => 'Email', 'type' => 'email', 'required' => true, 'max' => 160],
                'phone' => ['label' => 'Phone', 'type' => 'text', 'required' => false, 'max' => 32],
                'country' => ['label' => 'Country', 'type' => 'text', 'required' => true, 'min' => 2, 'max' => 80],
                'interest' => ['label' => 'Product / Service Interest', 'type' => 'select', 'required' => true, 'options' => AERO_INTEREST_OPTIONS],
                'quantity' => ['label' => 'Estimated Quantity', 'type' => 'select', 'required' => true, 'options' => AERO_QUANTITY_OPTIONS],
                'message' => ['label' => 'Message', 'type' => 'multiline', 'required' => true, 'min' => 20, 'max' => 5000],
            ],
        ],
        'support' => [
            'title' => 'New Support Request',
            'eyebrow' => 'New support request — aerocotton.in',
            'subject' => 'New Support Request - {priority} - {brand}',
            'footer' => 'Reply directly to this email to reach the customer. Submitted from the aerocotton.in support form.',
            'fields' => [
                'name' => ['label' => 'Name', 'type' => 'text', 'required' => true, 'min' => 2, 'max' => 80],
                'company' => ['label' => 'Company', 'type' => 'text', 'required' => false, 'max' => 120],
                'email' => ['label' => 'Email', 'type' => 'email', 'required' => true, 'max' => 160],
                'phone' => ['label' => 'Phone', 'type' => 'text', 'required' => false, 'max' => 32],
                'orderId' => ['label' => 'Customer / Order ID', 'type' => 'text', 'required' => false, 'max' => 60],
                'category' => ['label' => 'Support Category', 'type' => 'select', 'required' => true, 'options' => AERO_CATEGORY_OPTIONS],
                'priority' => ['label' => 'Priority', 'type' => 'select', 'required' => true, 'options' => AERO_PRIORITY_OPTIONS],
                'subject' => ['label' => 'Subject', 'type' => 'text', 'required' => true, 'min' => 3, 'max' => 140],
                'description' => ['label' => 'Description', 'type' => 'multiline', 'required' => true, 'min' => 20, 'max' => 5000],
            ],
        ],
    ];
}

/** A human timestamp in the mill's timezone. */
function aero_now(): array
{
    $tz = new DateTimeZone('Asia/Kolkata');
    $now = new DateTimeImmutable('now', $tz);
    return [
        'human' => $now->format('j F Y, g:i A') . ' IST',
        'iso' => $now->format('c'),
    ];
}

/**
 * Validate and sanitise one submission.
 *
 * @return array{data: array<string,string>, errors: array<string,string>}
 */
function aero_validate(string $form, array $input): array
{
    $specs = aero_form_specs();
    if (!isset($specs[$form])) {
        return ['data' => [], 'errors' => ['form' => 'Unknown form.']];
    }

    $data = [];
    $errors = [];

    foreach ($specs[$form]['fields'] as $key => $field) {
        $raw = $input[$key] ?? '';
        $value = is_scalar($raw) ? (string) $raw : '';
        $value = ($field['type'] === 'multiline') ? aero_clean_multiline($value) : aero_clean($value);
        $label = $field['label'];

        if ($value === '') {
            if (!empty($field['required'])) {
                $errors[$key] = "Please enter your {$label}.";
            }
            continue;
        }

        if (($field['type'] ?? '') === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $errors[$key] = 'Please enter a valid email address.';
            continue;
        }

        $max = (int) ($field['max'] ?? 5000);
        if (mb_strlen($value) > $max) {
            $errors[$key] = "{$label} is too long (max {$max} characters).";
            continue;
        }

        $min = (int) ($field['min'] ?? 0);
        if ($min > 0 && mb_strlen($value) < $min) {
            $errors[$key] = $min === 20
                ? "Please give us a little more detail in {$label} (at least {$min} characters)."
                : "{$label} looks too short.";
            continue;
        }

        if (($field['type'] ?? '') === 'select' && !in_array($value, $field['options'] ?? [], true)) {
            $errors[$key] = "Please choose a valid {$label}.";
            continue;
        }

        // Very light spam heuristic: a message stuffed with links is not an enquiry.
        if ($field['type'] === 'multiline' && preg_match_all('#https?://#i', $value) > 6) {
            $errors[$key] = 'That message contains too many links. Please email us directly.';
            continue;
        }

        $data[$key] = $value;
    }

    return ['data' => $data, 'errors' => $errors];
}

/** Notification email to the company inbox. */
function aero_build_notification(string $form, array $data, array $now, string $reference, array $config = []): array
{
    $spec = aero_form_specs()[$form];
    $subject = str_replace(
        ['{priority}', '{brand}'],
        [(string) ($data['priority'] ?? 'Normal'), (string) ($config['brand'] ?? 'Aerocotton')],
        $spec['subject']
    );

    $rows = '';
    $lines = [$spec['title'], ''];
    foreach ($spec['fields'] as $key => $field) {
        $rows .= aero_mail_row($field['label'] . ':', (string) ($data[$key] ?? ''));
        $lines[] = $field['label'] . ': ' . ($data[$key] ?? '—');
    }
    $rows .= aero_mail_row('Submitted At:', $now['human'] . ' (' . $reference . ')');
    $lines[] = '';
    $lines[] = 'Submitted At: ' . $now['human'];
    $lines[] = 'Reference: ' . $reference;

    return [
        'subject' => $subject,
        'html' => aero_mail_shell($spec['eyebrow'], $spec['title'], $rows, $spec['footer']),
        'text' => implode("\n", $lines),
    ];
}

/** Acknowledgement email to the visitor. */
function aero_build_confirmation(string $form, array $data, array $now, string $reference, array $config = []): array
{
    $isSupport = $form === 'support';
    $brand = (string) ($config['brand'] ?? 'Aerocotton');
    $title = 'Request Received';
    $summaryLines = [];

    if ($isSupport) {
        $summaryLines[] = ['Subject', (string) ($data['subject'] ?? '')];
        $summaryLines[] = ['Support Category', (string) ($data['category'] ?? '')];
        $summaryLines[] = ['Priority', (string) ($data['priority'] ?? '')];
    } else {
        $summaryLines[] = ['Product / Service Interest', (string) ($data['interest'] ?? '')];
        $summaryLines[] = ['Estimated Quantity', (string) ($data['quantity'] ?? '')];
    }

    $rows = aero_mail_row('Reference', $reference);
    foreach ($summaryLines as [$label, $value]) {
        $rows .= aero_mail_row($label, $value);
    }
    $rows .= aero_mail_row('Submitted At', $now['human']);

    $intro = 'Thank you. Your request has been successfully submitted. '
        . 'Our team will review it and get back to you shortly.';

    $html = '<div style="margin:0;padding:32px 16px;background:#f4f0e8;">'
        . '<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e3dcd0;">'
        . '<div style="padding:26px 32px;border-bottom:2px solid #b08d57;">'
        . '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#8a7d70;">' . htmlspecialchars($brand, ENT_QUOTES, 'UTF-8') . '</p>'
        . '<p style="margin:8px 0 0;font-family:Georgia,serif;font-size:21px;color:#171614;">' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '</p>'
        . '</div>'
        . '<div style="padding:26px 32px;">'
        . '<p style="margin:0 0 18px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:#171614;">'
        . htmlspecialchars($intro, ENT_QUOTES, 'UTF-8') . '</p>'
        . '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.7;color:#57493f;">'
        . 'We have received your request and our team will review it shortly. Quote your reference '
        . '<strong>' . htmlspecialchars($reference, ENT_QUOTES, 'UTF-8') . '</strong> in any follow-up.</p>'
        . '</div>'
        . '<table role="presentation" style="width:100%;border-collapse:collapse;">' . $rows . '</table>'
        . '<div style="padding:18px 32px;background:#f4f0e8;border-top:1px solid #e3dcd0;">'
        . '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8a7d70;">'
        . htmlspecialchars($brand, ENT_QUOTES, 'UTF-8') . ' · No 6, Maruthamuthu Thottam, Vengamedu, Karur 639006, Tamil Nadu, India</p>'
        . '</div></div></div>';

    $text = implode("\n", array_merge(
        [$title, '', $intro, '', 'Reference: ' . $reference],
        array_map(static fn ($pair) => $pair[0] . ': ' . $pair[1], $summaryLines),
        ['Submitted At: ' . $now['human'], '', $brand . ' — Karur, Tamil Nadu, India']
    ));

    return [
        'subject' => $brand . ' - Request Received [' . $reference . ']',
        'html' => $html,
        'text' => $text,
    ];
}
