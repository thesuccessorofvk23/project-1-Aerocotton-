<?php

declare(strict_types=1);

/**
 * A dependency-free SMTP client and MIME builder.
 *
 * BigRock shared hosting gives us PHP and a mailbox, so this talks to that
 * mailbox directly over authenticated SMTP (STARTTLS on 587 by default) rather
 * than relying on mail(), which has no delivery confirmation and is far more
 * likely to be filtered.
 */

if (!defined('AERO_API')) {
    http_response_code(404);
    exit;
}

final class AeroMailer
{
    /** @var resource|null */
    private $fp = null;
    /** @var list<string> Masked SMTP conversation, for the server-side log only. */
    private array $transcript = [];

    public function __construct(private array $config)
    {
    }

    public function transcript(): array
    {
        return $this->transcript;
    }

    /**
     * Deliver one message.
     *
     * @param array{
     *   subject: string,
     *   html: string,
     *   text: string,
     *   reply_to?: string,
     *   to?: string,
     *   attachments?: list<array{name:string,type:string,data:string}>
     * } $message
     * @return array{ok: bool, error?: string}
     */
    public function send(array $message): array
    {
        $cfg = $this->config;
        $to = (string) ($message['to'] ?? $cfg['to_email']);
        $from = (string) $cfg['from_email'];

        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return ['ok' => false, 'error' => 'No valid recipient address is configured.'];
        }
        if (!filter_var($from, FILTER_VALIDATE_EMAIL)) {
            return ['ok' => false, 'error' => 'No valid sender address is configured.'];
        }
        if (trim((string) $cfg['smtp_pass']) === '') {
            return ['ok' => false, 'error' => 'No SMTP password is configured.'];
        }

        $raw = $this->buildMessage($message, $from, $to);

        try {
            $this->connect();
            $this->command('EHLO ' . $this->heloName(), [250]);
            $this->startTlsIfNeeded();
            $this->authenticate();

            $this->command('MAIL FROM:<' . $from . '>', [250]);
            $this->command('RCPT TO:<' . $to . '>', [250, 251]);
            $this->command('DATA', [354]);
            $this->writePayload($raw);
            $this->command('.', [250]);
            $this->command('QUIT', [221]);
            $this->close();

            return ['ok' => true];
        } catch (Throwable $e) {
            $this->close();
            // The SMTP response is written to the private log, never to the browser:
            // it can reveal the server's configuration and the mailbox name.
            $this->transcript[] = 'ERROR: ' . $e->getMessage();
            return ['ok' => false, 'error' => 'The mail server refused the message.'];
        }
    }

    /**
     * Open the connection, negotiate TLS and authenticate, then hang up
     * without sending anything. Used by health.php so a host can be checked
     * before the first real enquiry depends on it.
     *
     * @return array{ok: bool, error?: string}
     */
    public function probe(): array
    {
        try {
            $this->connect();
            $this->command('EHLO ' . $this->heloName(), [250]);
            $this->startTlsIfNeeded();
            $this->authenticate();
            try {
                $this->command('QUIT', [221]);
            } catch (Throwable) {
                // A dropped QUIT is not a failure worth reporting.
            }
            $this->close();
            return ['ok' => true];
        } catch (Throwable $e) {
            $this->close();
            $this->transcript[] = 'ERROR: ' . $e->getMessage();
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    private function heloName(): string
    {
        $host = (string) ($_SERVER['SERVER_NAME'] ?? '');
        if ($host === '') {
            $host = 'localhost';
        }
        return preg_replace('/[^A-Za-z0-9.\-]/', '', $host) ?: 'localhost';
    }

    private function connect(): void
    {
        $cfg = $this->config;
        $secure = strtolower(trim((string) $cfg['smtp_secure']));
        $host = (string) $cfg['smtp_host'];
        $port = (int) $cfg['smtp_port'];
        $timeout = max(5, (int) ($cfg['smtp_timeout'] ?? 20));

        if ($host === '') {
            throw new RuntimeException('SMTP host is not configured.');
        }
        if ($secure === '' && $port === 587) {
            throw new RuntimeException('SMTP port 587 requires STARTTLS; set smtp_secure to "tls".');
        }

        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
                'allow_self_signed' => false,
                'SNI_enabled' => true,
                'peer_name' => $host,
            ],
        ]);

        $remote = ($secure === 'ssl' ? 'ssl://' : '') . $host . ':' . $port;
        $errno = 0;
        $errstr = '';
        $this->transcript[] = 'CONNECT ' . $remote . ($secure === 'ssl' ? ' (implicit TLS)' : '');
        $fp = @stream_socket_client($remote, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);

        if ($fp === false) {
            throw new RuntimeException(sprintf('Cannot reach the mail server (%s%s).', $errstr !== '' ? $errstr : 'connection failed', $errno ? ' #' . $errno : ''));
        }

        stream_set_timeout($fp, $timeout);
        $this->fp = $fp;
        $this->expect([220]);
    }

    private function startTlsIfNeeded(): void
    {
        $secure = strtolower(trim((string) $this->config['smtp_secure']));
        if ($secure !== 'tls') {
            return;
        }
        $this->command('STARTTLS', [220]);
        $ok = @stream_socket_enable_crypto($this->fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if ($ok !== true) {
            throw new RuntimeException('TLS negotiation failed.');
        }
        $this->transcript[] = 'TLS established';
        $this->command('EHLO ' . $this->heloName(), [250]);
    }

    private function authenticate(): void
    {
        $user = (string) $this->config['smtp_user'];
        $pass = (string) $this->config['smtp_pass'];
        if ($user === '') {
            return; // relay that does not require authentication
        }

        $caps = strtoupper($this->lastResponse);
        $useLogin = str_contains($caps, 'AUTH') && !str_contains($caps, 'PLAIN') ? true : str_contains($caps, 'LOGIN');

        if ($useLogin || !str_contains($caps, 'PLAIN')) {
            $this->command('AUTH LOGIN', [334]);
            $this->command(base64_encode($user), [334], 'AUTH user ***');
            $this->command(base64_encode($pass), [235, 503], 'AUTH pass ***');
            return;
        }

        $this->command('AUTH PLAIN ' . base64_encode("\0" . $user . "\0" . $pass), [235, 503], 'AUTH PLAIN ***');
    }

    private string $lastResponse = '';

    /** Send one command and require an expected reply code. */
    private function command(string $line, array $expect, ?string $logAs = null): string
    {
        if ($this->fp === null) {
            throw new RuntimeException('Not connected.');
        }
        $this->transcript[] = '> ' . ($logAs ?? $line);
        $written = @fwrite($this->fp, $line . "\r\n");
        if ($written === false) {
            throw new RuntimeException('The connection dropped while sending.');
        }
        return $this->expect($expect);
    }

    /** Read a (possibly multi-line) SMTP reply and check its status code. */
    private function expect(array $codes): string
    {
        if ($this->fp === null) {
            throw new RuntimeException('Not connected.');
        }
        $response = '';
        for ($i = 0; $i < 60; $i++) {
            $chunk = @fgets($this->fp, 2048);
            if ($chunk === false) {
                throw new RuntimeException('No reply from the mail server (timed out).');
            }
            $response .= $chunk;
            // A final line looks like "250 text"; continuations use "250-text".
            if (preg_match('/^\d{3} /', $chunk) === 1) {
                break;
            }
        }

        $response = rtrim($response, "\r\n");
        $this->lastResponse = $response;
        $this->transcript[] = '< ' . $response;

        $code = (int) substr($response, 0, 3);
        if (!in_array($code, $codes, true)) {
            throw new RuntimeException(sprintf('Mail server replied %d (%s).', $code, substr($response, 0, 160)));
        }
        return $response;
    }

    /** Send the message body, escaping leading dots and terminating with CRLF.CRLF. */
    private function writePayload(string $raw): void
    {
        if ($this->fp === null) {
            throw new RuntimeException('Not connected.');
        }
        // One pass only: replacing "\r\n" first and "\n" second would rewrite the
        // newline of an already-converted pair and produce a stray CR every line.
        $normalised = preg_replace('/\r\n|\r|\n/', "\r\n", $raw) ?? $raw;
        $normalised = preg_replace('/^\./m', '..', $normalised) ?? $normalised;
        if (@fwrite($this->fp, $normalised . "\r\n") === false) {
            throw new RuntimeException('The connection dropped while sending the message.');
        }
    }

    private function close(): void
    {
        if ($this->fp !== null) {
            @fclose($this->fp);
            $this->fp = null;
        }
    }

    /* ── MIME ─────────────────────────────────────────────────────────── */

    /** RFC 2047 encode a header value when it contains anything non-ASCII. */
    private function encodeHeader(string $value): string
    {
        $value = str_replace(["\r", "\n"], ' ', $value);
        if (preg_match('/[^\x20-\x7E]/', $value) !== 1) {
            return $value;
        }
        return '=?UTF-8?B?' . base64_encode($value) . '?=';
    }

    /** Fold a base64 body into 76-character lines. */
    private function base64Body(string $data): string
    {
        return rtrim(chunk_split(base64_encode($data), 76, "\r\n"));
    }

    private function buildMessage(array $message, string $from, string $to): string
    {
        $subject = (string) $message['subject'];
        $boundaryAlt = 'aero-alt-' . bin2hex(random_bytes(12));
        $boundaryMixed = 'aero-mix-' . bin2hex(random_bytes(12));
        $attachments = $message['attachments'] ?? [];
        $hasAttachments = $attachments !== [];

        $headers = [
            'Date: ' . date('r'),
            'From: ' . $this->encodeHeader((string) $this->config['from_name']) . ' <' . $from . '>',
            'To: <' . $to . '>',
        ];

        $replyTo = trim((string) ($message['reply_to'] ?? ''));
        if ($replyTo !== '' && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
            $headers[] = 'Reply-To: <' . $replyTo . '>';
        }

        $headers[] = 'Subject: ' . $this->encodeHeader($subject);
        $domain = substr(strrchr($from, '@') ?: '@localhost', 1);
        $headers[] = 'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . preg_replace('/[^A-Za-z0-9.\-]/', '', $domain) . '>';
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'X-Mailer: Aerocotton mail endpoint';
        $headers[] = 'Auto-Submitted: auto-generated';

        $alternative = "--{$boundaryAlt}\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . $this->base64Body((string) $message['text']) . "\r\n\r\n"
            . "--{$boundaryAlt}\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . $this->base64Body((string) $message['html']) . "\r\n\r\n"
            . "--{$boundaryAlt}--";

        if (!$hasAttachments) {
            $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundaryAlt . '"';
            return implode("\r\n", $headers) . "\r\n\r\n" . $alternative;
        }

        $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundaryMixed . '"';
        $body = "--{$boundaryMixed}\r\n"
            . 'Content-Type: multipart/alternative; boundary="' . $boundaryAlt . "\"\r\n\r\n"
            . $alternative . "\r\n\r\n";

        foreach ($attachments as $file) {
            $name = $this->encodeHeader((string) $file['name']);
            $body .= "--{$boundaryMixed}\r\n"
                . 'Content-Type: ' . $file['type'] . "; name=\"{$name}\"\r\n"
                . "Content-Transfer-Encoding: base64\r\n"
                . 'Content-Disposition: attachment; filename="' . $name . "\"\r\n\r\n"
                . $this->base64Body((string) $file['data']) . "\r\n\r\n";
        }

        $body .= "--{$boundaryMixed}--";
        return implode("\r\n", $headers) . "\r\n\r\n" . $body;
    }
}

/**
 * Render one label/value row for the HTML emails. Values are escaped here so
 * callers cannot forget to.
 */
function aero_mail_row(string $label, string $value): string
{
    $esc = static fn (string $v): string => htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    return '<tr>'
        . '<td style="padding:10px 18px;border-bottom:1px solid #e3dcd0;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a7d70;white-space:nowrap;vertical-align:top;">' . $esc($label) . '</td>'
        . '<td style="padding:10px 18px;border-bottom:1px solid #e3dcd0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#171614;">' . nl2br($esc($value), false) . '</td>'
        . '</tr>';
}

/** Wrap rows in the house email shell (ivory ground, cocoa type, brass rule). */
function aero_mail_shell(string $eyebrow, string $title, string $rowsHtml, string $footerNote): string
{
    return '<div style="margin:0;padding:32px 16px;background:#f4f0e8;">'
        . '<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e3dcd0;">'
        . '<div style="padding:26px 32px;border-bottom:2px solid #b08d57;">'
        . '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#8a7d70;">' . htmlspecialchars($eyebrow, ENT_QUOTES, 'UTF-8') . '</p>'
        . '<p style="margin:8px 0 0;font-family:Georgia,serif;font-size:21px;color:#171614;">' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '</p>'
        . '</div>'
        . '<table role="presentation" style="width:100%;border-collapse:collapse;">' . $rowsHtml . '</table>'
        . '<div style="padding:18px 32px;background:#f4f0e8;border-top:1px solid #e3dcd0;">'
        . '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8a7d70;">' . htmlspecialchars($footerNote, ENT_QUOTES, 'UTF-8') . '</p>'
        . '</div></div></div>';
}
