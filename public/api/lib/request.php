<?php

declare(strict_types=1);

/**
 * Reading the incoming submission and answering it.
 *
 * Two shapes are accepted, because the forms use the first and curl/scripts
 * find the second convenient:
 *   - application/json      { "form": "contact", "name": "…" }
 *   - multipart/form-data   field per input, files[] for attachments
 *
 * @return array{input: array<string,mixed>, files: list<array{name:string,tmp:string,error:int,size:int,type:string}>, error: ?string}
 */

if (!defined('AERO_API')) {
    http_response_code(404);
    exit;
}

/** Emit a JSON response and stop. Never leaks internal detail. */
function aero_json(int $status, array $payload): void
{
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, max-age=0');
        header('X-Content-Type-Options: nosniff');
    }
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/** A failure the visitor is allowed to see. */
function aero_fail(int $status, string $message, array $extra = []): void
{
    aero_json($status, ['ok' => false, 'message' => $message] + $extra);
}

/**
 * True when PHP discarded the body because it exceeded post_max_size.
 *
 * The signature is a declared Content-Length with completely empty
 * superglobals — but only for form encodings. A JSON body legitimately leaves
 * $_POST empty, so it must not be mistaken for an oversized form post.
 */
function aero_body_too_large(): bool
{
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) !== 'POST') {
        return false;
    }

    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
    if (str_contains($contentType, 'application/json')) {
        return false;
    }

    $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    return $length > 0 && $_POST === [] && $_FILES === [];
}

/**
 * Flatten $_FILES into a simple list, tolerating both `files[]` and `files`.
 *
 * @return list<array{name:string,tmp:string,error:int,size:int,type:string}>
 */
function aero_normalise_files(): array
{
    $raw = $_FILES['files'] ?? null;
    if (!is_array($raw)) {
        return [];
    }

    // A single <input type="file"> posts a flat array of scalars.
    $isList = is_array($raw['name'] ?? null);

    $names = $isList ? (array) $raw['name'] : [$raw['name'] ?? ''];
    $tmps  = $isList ? (array) $raw['tmp_name'] : [$raw['tmp_name'] ?? ''];
    $errors = $isList ? (array) $raw['error'] : [$raw['error'] ?? UPLOAD_ERR_NO_FILE];
    $sizes = $isList ? (array) $raw['size'] : [$raw['size'] ?? 0];
    $types = $isList ? (array) $raw['type'] : [$raw['type'] ?? ''];

    $files = [];
    foreach ($names as $i => $name) {
        $error = (int) ($errors[$i] ?? UPLOAD_ERR_NO_FILE);
        if ($error === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        $files[] = [
            'name' => (string) $name,
            'tmp' => (string) ($tmps[$i] ?? ''),
            'error' => $error,
            'size' => (int) ($sizes[$i] ?? 0),
            'type' => (string) ($types[$i] ?? ''),
        ];
    }
    return $files;
}

/** Read the submission from the request body. */
function aero_read_request(): array
{
    if (aero_body_too_large()) {
        return ['input' => [], 'files' => [], 'error' => 'upload-too-large'];
    }

    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
    $input = [];

    if (str_contains($contentType, 'application/json')) {
        $body = (string) file_get_contents('php://input');
        if (strlen($body) > 1048576) {
            return ['input' => [], 'files' => [], 'error' => 'body-too-large'];
        }
        $decoded = json_decode($body, true);
        if (!is_array($decoded)) {
            return ['input' => [], 'files' => [], 'error' => 'malformed-json'];
        }
        $input = $decoded;
    } else {
        $input = $_POST;
    }

    // The form name arrives either in the query string or in the body.
    if (!isset($input['form'])) {
        $queryForm = $_GET['form'] ?? null;
        if (is_string($queryForm) && $queryForm !== '') {
            $input['form'] = $queryForm;
        }
    }

    return ['input' => $input, 'files' => aero_normalise_files(), 'error' => null];
}
