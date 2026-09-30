<?php

declare(strict_types=1);

/**
 * Attachment intake.
 *
 * A file is only trusted after its real contents have been inspected with
 * finfo — the browser's Content-Type and the filename extension are both
 * attacker-controlled. Executables, scripts and anything not on the allow-list
 * are dropped rather than passed to the mailer.
 */

if (!defined('AERO_API')) {
    http_response_code(404);
    exit;
}

/**
 * @param list<array{name:string,tmp:string,error:int,size:int,type:string}> $files
 * @return array{attachments: list<array{name:string,type:string,data:string}>, errors: list<string>}
 */
function aero_collect_uploads(array $files, array $config): array
{
    if ($files === []) {
        return ['attachments' => [], 'errors' => []];
    }

    if (empty($config['allow_uploads'])) {
        return ['attachments' => [], 'errors' => ['File uploads are not accepted at this address.']];
    }

    $maxFiles = max(1, (int) $config['max_upload_files']);
    if (count($files) > $maxFiles) {
        return ['attachments' => [], 'errors' => [sprintf('Please attach at most %d files.', $maxFiles)]];
    }

    $maxBytes = max(1024, (int) $config['max_upload_bytes']);
    $maxTotal = max($maxBytes, (int) ($config['max_upload_total'] ?? $maxBytes));
    $allowed = array_map('strtolower', array_map('strval', $config['allowed_upload_types'] ?? []));

    $attachments = [];
    $errors = [];
    $total = 0;

    foreach ($files as $file) {
        $label = aero_clean(basename((string) $file['name'])) ?: 'attachment';

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = match ($file['error']) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => sprintf('“%s” is larger than this server accepts.', $label),
                UPLOAD_ERR_PARTIAL => sprintf('“%s” did not finish uploading. Please try again.', $label),
                UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE => sprintf('“%s” could not be stored on the server.', $label),
                default => sprintf('“%s” was not accepted.', $label),
            };
            continue;
        }

        if ($file['tmp'] === '' || !is_uploaded_file($file['tmp'])) {
            $errors[] = sprintf('“%s” was not a valid upload.', $label);
            continue;
        }

        $size = (int) $file['size'];
        if ($size <= 0) {
            $errors[] = sprintf('“%s” arrived empty.', $label);
            continue;
        }
        if ($size > $maxBytes) {
            $errors[] = sprintf(
                '“%s” is larger than the %s limit.',
                $label,
                aero_bytes($maxBytes)
            );
            continue;
        }
        if ($total + $size > $maxTotal) {
            $errors[] = sprintf('The attachments together exceed the %s limit.', aero_bytes($maxTotal));
            break;
        }

        $mime = aero_sniff_mime($file['tmp']);
        if (!in_array($mime, $allowed, true)) {
            $errors[] = sprintf('“%s” is not a file type we accept.', $label);
            continue;
        }

        $data = @file_get_contents($file['tmp']);
        if (!is_string($data) || $data === '') {
            $errors[] = sprintf('“%s” could not be read.', $label);
            continue;
        }

        $total += $size;
        $attachments[] = [
            'name' => aero_safe_filename($label, $mime),
            'type' => $mime,
            'data' => $data,
        ];
    }

    return ['attachments' => $attachments, 'errors' => $errors];
}

/** The real MIME type, from the file's magic bytes. */
function aero_sniff_mime(string $path): string
{
    if (!class_exists('finfo')) {
        return 'application/octet-stream';
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($path);
    return is_string($mime) && $mime !== '' ? strtolower($mime) : 'application/octet-stream';
}

/** Keep the visitor's filename but neutralise anything that could escape it. */
function aero_safe_filename(string $name, string $mime): string
{
    $name = preg_replace('/[\\\\\/:*?"<>|\x00-\x1F]/u', '', $name) ?? 'attachment';
    $name = str_replace('..', '', $name);
    $name = trim($name);
    if ($name === '' || $name === '.') {
        $name = 'attachment';
    }

    $extension = strtolower((string) pathinfo($name, PATHINFO_EXTENSION));
    $expected = [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/heic' => 'heic',
        'text/csv' => 'csv',
        'text/plain' => 'txt',
        'application/msword' => 'doc',
        'application/vnd.ms-excel' => 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
    ][$mime] ?? 'dat';

    if ($extension === '' || $extension !== $expected) {
        $stem = $extension === '' ? $name : substr($name, 0, -(strlen($extension) + 1));
        $name = ($stem !== '' ? $stem : 'attachment') . '.' . $expected;
    }

    return mb_substr($name, 0, 120);
}

/** "4 MB" — for the messages the visitor reads. */
function aero_bytes(int $bytes): string
{
    if ($bytes >= 1048576) {
        return rtrim(rtrim(number_format($bytes / 1048576, 1), '0'), '.') . ' MB';
    }
    if ($bytes >= 1024) {
        return rtrim(rtrim(number_format($bytes / 1024, 1), '0'), '.') . ' KB';
    }
    return $bytes . ' bytes';
}
