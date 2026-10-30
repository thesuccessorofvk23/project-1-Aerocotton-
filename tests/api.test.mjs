/**
 * The contact-form backend suite.
 *
 *     npm test
 *
 * Every scenario talks to a real PHP server over HTTP, and every message the
 * endpoint claims to have sent is read back out of a real SMTP capture server.
 * Nothing is stubbed, so a pass means the endpoint genuinely did it.
 *
 * The suite is also the guard on two promises that are easy to break silently:
 * a demo can never deliver to a real mailbox, and the process never reaches a
 * real recipient even when asked to.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  PHP,
  ROOT,
  activeSmtpPort,
  captured,
  clearMail,
  contactPayload,
  freePort,
  fromOf,
  postMultipart,
  postRaw,
  recipientsOf,
  replyToOf,
  startMailpit,
  startPhp,
  stopAllServers,
  stopMailpit,
  supportPayload,
  waitForMailCount,
} from "./lib/harness.mjs";

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "aero-suite-"));
let seq = 0;

/** One isolated configuration for one server. */
function env(overrides = {}) {
  const n = ++seq;
  return {
    AERO_MAIL_MODE: "local",
    AERO_DATA_DIR: path.join(TMP, `data-${n}`),
    AERO_LOG_FILE: path.join(TMP, `logs-${n}`, "submissions.log"),
    AERO_RATE_LIMIT_MAX: "1000",
    AERO_DAILY_LIMIT: "1000",
    // Point at this run's capture server unless a scenario says otherwise.
    AERO_SMTP_PORT: String(activeSmtpPort()),
    ...overrides,
  };
}

/** The endpoint's own private log, parsed. */
function logEvents(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/** Ask PHP itself whether an XML file is well formed. */
function xmlIsValid(file) {
  const result = spawnSync(
    PHP,
    ["-r", `echo @simplexml_load_file(${JSON.stringify(file)}) === false ? "INVALID" : "VALID";`],
    { encoding: "utf8" }
  );
  return result.stdout.trim();
}

/**
 * A minimal SMTP server that advertises AUTH and then refuses the password, so
 * the authentication-failure path can be exercised for real.
 */
async function rejectingSmtp() {
  const port = await freePort();
  const server = net.createServer((socket) => {
    let sawUser = false;
    socket.write("220 test.invalid ESMTP ready\r\n");
    socket.on("data", (chunk) => {
      const command = chunk.toString().trim();
      if (/^EHLO|^HELO/i.test(command)) {
        socket.write("250-test.invalid\r\n250-AUTH LOGIN PLAIN\r\n250 8BITMIME\r\n");
      } else if (/^AUTH LOGIN/i.test(command)) {
        socket.write("334 VXNlcm5hbWU6\r\n");
      } else if (/^[A-Za-z0-9+/=]+$/.test(command) && !sawUser) {
        sawUser = true;
        socket.write("334 UGFzc3dvcmQ6\r\n");
      } else if (/^[A-Za-z0-9+/=]+$/.test(command)) {
        socket.write("535 5.7.8 Authentication credentials invalid\r\n");
      } else if (/^QUIT/i.test(command)) {
        socket.write("221 bye\r\n");
        socket.end();
      } else {
        socket.write("502 not implemented\r\n");
      }
    });
    socket.on("error", () => {});
  });
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  return { port, close: () => server.close() };
}

/**
 * A minimal SMTP server that can refuse the message at a chosen stage, or fall
 * silent once connected. Used to prove that a refusal *by the mail server* — as
 * opposed to a failure to reach it — is reported honestly and never as a
 * success.
 */
async function stagedSmtp({ rejectMailFrom = false, rejectRcptTo = false, silent = false } = {}) {
  const port = await freePort();
  const server = net.createServer((socket) => {
    if (silent) return; // accept the connection, then never answer
    socket.write("220 test.invalid ESMTP ready\r\n");
    socket.on("data", (chunk) => {
      const command = chunk.toString().trim();
      if (/^EHLO|^HELO/i.test(command)) socket.write("250-test.invalid\r\n250 8BITMIME\r\n");
      else if (/^MAIL FROM/i.test(command)) socket.write(rejectMailFrom ? "550 5.1.8 Sender address rejected\r\n" : "250 OK\r\n");
      else if (/^RCPT TO/i.test(command)) socket.write(rejectRcptTo ? "550 5.1.1 Recipient address rejected\r\n" : "250 OK\r\n");
      else if (/^DATA/i.test(command)) socket.write("354 End data with <CR><LF>.<CR><LF>\r\n");
      else if (/^QUIT/i.test(command)) {
        socket.write("221 bye\r\n");
        socket.end();
      } else socket.write("250 OK\r\n"); // the payload, terminated by a lone "."
    });
    socket.on("error", () => {});
  });
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  return { port, close: () => server.close() };
}

test("contact-form backend", async (t) => {
  await startMailpit();
  t.after(() => {
    stopAllServers();
    stopMailpit();
  });

  /* One long-lived server in local capture mode for the request-level tests. */
  const localEnv = env({ AERO_SMTP_PORT: String(activeSmtpPort()) });
  const api = await startPhp(localEnv);

  /* ── 1. A valid submission, end to end ────────────────────────────────── */

  await t.test("1. a valid contact submission is delivered and reported", async () => {
    await clearMail();
    const payload = contactPayload();
    const { status, json } = await postMultipart(api.url, "contact", payload);

    assert.equal(status, 200, JSON.stringify(json));
    assert.equal(json.ok, true);
    assert.match(json.reference, /^AH-\d{4}-\d{6}$/);
    assert.equal(json.mailMode, "local");
    assert.ok(json.submittedAt, "submittedAt should be present");

    // One submission produces two messages in the demo states: the notification
    // and the acknowledgement, both delivered to the one review inbox.
    assert.equal(await waitForMailCount(2), 2, "both messages should reach SMTP");
    const messages = await captured();

    const notification = messages.find((m) => /New Contact Inquiry/.test(m.Subject ?? ""));
    assert.ok(notification, "the notification should have been captured");
    assert.equal(notification.Subject, "[LOCAL CAPTURE] New Contact Inquiry - Aerocotton");

    // Local capture forces the recipient on every message, whatever the form
    // contained and whoever the visitor claimed to be.
    for (const message of messages) {
      assert.deepEqual(recipientsOf(message), ["dev@aerocotton.test"]);
    }
  });

  /* ── 10. Recipient, subject, Reply-To and body ────────────────────────── */

  await t.test("10. the message carries the right recipient, subject, Reply-To and body", async () => {
    await clearMail();
    const payload = contactPayload({
      name: "Meera Suresh",
      company: "Coastal Linen Exports",
      email: "meera@coastal-linen.example",
      country: "United Arab Emirates",
      interest: "Samples and swatches",
      phone: "+971 50 123 4567",
      message: "Please quote 1,200 pieces of a 600 GSM cotton bath mat with our own label sewn in.",
    });

    const { status, json } = await postMultipart(api.url, "contact", payload);
    assert.equal(status, 200);
    assert.equal(json.ok, true);

    // The notification and the acknowledgement both land in the capture inbox.
    assert.equal(await waitForMailCount(2), 2);
    const [notification, acknowledgement] = await captured();

    assert.deepEqual(recipientsOf(notification), ["dev@aerocotton.test"]);
    assert.deepEqual(replyToOf(notification), ["meera@coastal-linen.example"], "Reply-To must reach the enquirer");
    assert.equal(fromOf(notification), "Aerocotton Website <website@aerocotton.test>");

    const body = notification.Text ?? "";
    for (const field of [
      "Meera Suresh",
      "Coastal Linen Exports",
      "meera@coastal-linen.example",
      "+971 50 123 4567",
      "United Arab Emirates",
      "600 GSM cotton bath mat",
      "Samples and swatches",
    ]) {
      assert.ok(body.includes(field), `the plain-text part should contain ${field}`);
    }
    assert.ok(body.includes(json.reference), "the reference should appear in the body");
    assert.ok((notification.HTML ?? "").includes(json.reference), "the HTML part should carry the reference too");

    // Both MIME parts must be present: a text-only mail client still gets a
    // readable enquiry.
    assert.ok((notification.HTML ?? "").includes("<html") || (notification.HTML ?? "").includes("<div"), "the HTML part should be present");
    assert.ok(body.length > 100, "the plain-text alternative should be substantive");

    assert.equal(acknowledgement.Subject, `[LOCAL CAPTURE] Aerocotton - Request Received [${json.reference}]`);
    assert.deepEqual(recipientsOf(acknowledgement), ["dev@aerocotton.test"]);
    assert.ok((acknowledgement.Text ?? "").includes(json.reference));
    assert.equal(json.acknowledged, true, "the endpoint reports the acknowledgement was accepted by SMTP");
  });

  await t.test("10c. user-supplied HTML is escaped, not carried into the email", async () => {
    await clearMail();
    const payload = contactPayload({
      name: '<script>alert(1)</script>',
      message: 'Please quote 500 units. <img src=x onerror=alert(2)> and also <b>bold</b> for the label.',
    });

    const { status, json } = await postMultipart(api.url, "contact", payload);
    assert.equal(status, 200, JSON.stringify(json));
    assert.equal(await waitForMailCount(2), 2);

    const messages = await captured();
    const notification = messages.find((m) => /New Contact Inquiry/.test(m.Subject ?? ""));
    const html = notification.HTML ?? "";

    // The property that matters is that no markup survives: the visitor's text
    // may still *read* "onerror=", it just cannot be an attribute.
    assert.ok(!html.includes("<script"), "a script tag must not survive into the HTML part");
    assert.ok(!/<img[\s>]/i.test(html), "an img tag must not survive into the HTML part");
    assert.ok(html.includes("&lt;script&gt;"), "the tag should be visible as escaped text");
    assert.ok(html.includes("&lt;img"), "the second tag should be escaped too");

    // The plain-text part is not markup, so the original characters are right.
    assert.ok((notification.Text ?? "").includes("<script>"), "the text part keeps the literal text");
  });

  await t.test("10b. a support submission produces the support notification", async () => {
    await clearMail();
    const payload = supportPayload();
    const { status, json } = await postMultipart(api.url, "support", payload);
    assert.equal(status, 200, JSON.stringify(json));
    assert.equal(await waitForMailCount(2), 2);

    const notification = (await captured()).find((m) => /New Support Request/.test(m.Subject ?? ""));
    assert.ok(notification, "the support notification should have been captured");
    assert.equal(notification.Subject, "[LOCAL CAPTURE] New Support Request - High - Aerocotton");
    assert.ok(summaryText(notification).includes("Shipment delayed at Chennai"));
    assert.ok(summaryText(notification).includes("AH-2026-000042"), "the order id should be carried");
  });

  /* ── 2. Missing and invalid fields ────────────────────────────────────── */

  await t.test("2. missing and invalid fields are rejected field by field", async () => {
    const cases = [
      [{ name: "" }, "name"],
      [{ email: "not-an-address" }, "email"],
      [{ country: "" }, "country"],
      [{ interest: "Free money" }, "interest"],
      [{ message: "too short" }, "message"],
      [{ company: "" }, "company"],
    ];

    for (const [override, expectedField] of cases) {
      const { status, json } = await postMultipart(api.url, "contact", contactPayload(override));
      assert.equal(status, 422, `expected 422 for ${expectedField}`);
      assert.equal(json.ok, false);
      assert.ok(json.errors?.[expectedField], `expected an error on ${expectedField}`);
    }

    // The whole form is validated per field, not just the first failure.
    const { json } = await postMultipart(api.url, "contact", contactPayload({ name: "", email: "", message: "" }));
    assert.deepEqual(Object.keys(json.errors).sort(), ["email", "message", "name"]);
  });

  /* ── 2b. Unknown form identifier ─────────────────────────────────────── */

  await t.test("2b. an unknown or missing form identifier is refused", async () => {
    // A form name the endpoint does not know: the field contract cannot be
    // chosen, so nothing about the submission is even validated.
    const unknown = await postMultipart(api.url, "nope", contactPayload());
    assert.equal(unknown.status, 400);
    assert.equal(unknown.json.ok, false);
    assert.match(unknown.json.message, /which form/i);

    // The same payload with no form at all — neither in the query string nor
    // in the body. The two public forms are the only way in.
    const body = new FormData();
    for (const [key, value] of Object.entries(contactPayload())) {
      if (key !== "form") body.append(key, String(value));
    }
    const res = await fetch(`${api.url}/api/submit.php`, { method: "POST", body });
    const json = await res.json();
    assert.equal(res.status, 400);
    assert.match(json.message, /which form/i);
  });

  /* ── 3. Unsupported HTTP methods ─────────────────────────────────────── */

  await t.test("3. unsupported methods are refused with the allowed set", async () => {
    const get = await fetch(`${api.url}/api/submit.php?form=contact`);
    assert.equal(get.status, 405);
    assert.match(get.headers.get("allow") ?? "", /POST/);

    const del = await fetch(`${api.url}/api/submit.php?form=contact`, { method: "DELETE" });
    assert.equal(del.status, 405);

    const options = await fetch(`${api.url}/api/submit.php?form=contact`, { method: "OPTIONS" });
    assert.equal(options.status, 204);
  });

  /* ── 4. Malformed and oversized requests ─────────────────────────────── */

  await t.test("4. malformed and oversized bodies are refused", async () => {
    const broken = await postRaw(api.url, "contact", "{not json", {
      headers: { "Content-Type": "application/json" },
    });
    assert.equal(broken.status, 400);

    const tooBigJson = await postRaw(api.url, "contact", JSON.stringify({ pad: "x".repeat(1_200_000) }), {
      headers: { "Content-Type": "application/json" },
    });
    assert.equal(tooBigJson.status, 413);
  });

  await t.test("4b. a body past post_max_size reports a size problem, not a parse failure", async () => {
    const small = await startPhp(env(), { args: ["-d", "post_max_size=512K", "-d", "upload_max_filesize=512K"] });
    const body = new FormData();
    body.append("form", "contact");
    body.append("name", "Priya Raman");
    body.append("pad", "x".repeat(900_000));

    const res = await fetch(`${small.url}/api/submit.php?form=contact`, { method: "POST", body });
    const json = await res.json();
    assert.equal(res.status, 413, `server ${small.url} answered ${JSON.stringify(json)}`);
    assert.match(json.message, /larger than this server accepts|too large/i);
    // The visitor must not be told their fields are missing when the real
    // problem is the size of what they sent.
    assert.equal(json.errors, undefined, "a size problem is not a field-validation problem");
    small.stop();
  });

  /* ── 5. Rate limiting ────────────────────────────────────────────────── */

  await t.test("5. the rate limiter refuses the third rapid submission", async () => {
    const limitedEnv = env({ AERO_RATE_LIMIT_MAX: "2" });
    const limited = await startPhp(limitedEnv);

    const statuses = [];
    for (let i = 0; i < 3; i++) {
      const { status } = await postMultipart(limited.url, "contact", contactPayload({ name: `Visitor ${i}` }));
      statuses.push(status);
    }

    assert.deepEqual(statuses, [200, 200, 429]);
    assert.ok(logEvents(limitedEnv.AERO_LOG_FILE).some((e) => e.event === "rate_limited"));
    limited.stop();
  });

  /* ── 6. Missing SMTP configuration ───────────────────────────────────── */

  await t.test("6. an unconfigured or unapproved mailbox refuses to send", async () => {
    const cases = [
      // Production with no approval recorded at all.
      [
        "production without approval",
        env({ AERO_MAIL_MODE: "production", AERO_SMTP_HOST: "smtp.example.net", AERO_SMTP_USER: "a@b.in", AERO_SMTP_PASS: "x" }),
        /Production delivery is not authorised/i,
      ],
      // Production approved but the password is missing.
      [
        "production approved but no password",
        env({ AERO_MAIL_MODE: "production", AERO_MAIL_PRODUCTION_APPROVED: "1", AERO_SMTP_HOST: "smtp.example.net", AERO_SMTP_USER: "a@b.in" }),
        /smtp_pass is not configured/i,
      ],
      // Sample review with no approval recorded.
      [
        "sample review without authorisation",
        env({ AERO_MAIL_MODE: "sample", AERO_SMTP_HOST: "smtp.example.net", AERO_SMTP_USER: "a@b.in", AERO_SMTP_PASS: "x" }),
        /Sample review is not authorised/i,
      ],
      // A mode nobody defined.
      ["an unknown mail mode", env({ AERO_MAIL_MODE: "live" }), /must be one of/i],
    ];

    await clearMail();

    for (const [label, cfg, expectedProblem] of cases) {
      const server = await startPhp(cfg);
      const { status, json } = await postMultipart(server.url, "contact", contactPayload());
      assert.equal(status, 503, label);
      assert.equal(json.ok, false, label);

      // The visitor gets one honest, non-specific sentence; the reason — which
      // names settings — goes only to the server-side log.
      assert.ok(
        !/smtp|password|config/i.test(json.message),
        `${label}: the refusal must not name internal settings`
      );

      const problems = logEvents(cfg.AERO_LOG_FILE).find((e) => e.event === "mail_mode_blocked")?.problems ?? [];
      assert.ok(
        problems.some((p) => expectedProblem.test(p)),
        `${label}: expected a problem matching ${expectedProblem}, got ${JSON.stringify(problems)}`
      );
      server.stop();
    }

    assert.equal((await captured()).length, 0, "a refused submission must not reach any SMTP server");
  });

  /* ── 7 & 8. Connection and authentication failures ───────────────────── */

  await t.test("7. an unreachable mail server produces an honest failure", async () => {
    const dead = await freePort();
    const cfg = env({ AERO_SMTP_PORT: String(dead), AERO_SMTP_TIMEOUT: "3" });
    const server = await startPhp(cfg);

    const { status, json } = await postMultipart(server.url, "contact", contactPayload());
    assert.equal(status, 502);
    assert.equal(json.ok, false);
    assert.match(json.message, /could not deliver/i);
    assert.ok(json.reference, "the enquiry keeps a reference so it is not lost silently");

    const events = logEvents(cfg.AERO_LOG_FILE);
    const failure = events.find((e) => e.event === "delivery_failed");
    assert.ok(failure, "the delivery failure should be logged with the submission");
    assert.match(JSON.stringify(failure), /Cannot reach|connection failed/i);
    server.stop();
  });

  await t.test("8. an authentication rejection produces an honest failure", async () => {
    const smtp = await rejectingSmtp();
    const cfg = env({
      AERO_SMTP_PORT: String(smtp.port),
      AERO_SMTP_USER: "mailbox@example.net",
      AERO_SMTP_PASS: "definitely-not-the-password",
      AERO_SMTP_TIMEOUT: "5",
    });
    const server = await startPhp(cfg);

    const { status, json } = await postMultipart(server.url, "contact", contactPayload());
    assert.equal(status, 502);
    assert.match(json.message, /could not deliver/i);

    const failure = logEvents(cfg.AERO_LOG_FILE).find((e) => e.event === "delivery_failed");
    assert.ok(failure);
    assert.match(JSON.stringify(failure), /535|refused the message/i);

    // The masked transcript is what makes a support call possible. The password
    // itself must never be in the log.
    assert.ok(!JSON.stringify(failure).includes("definitely-not-the-password"), "the password must be masked out of the log");
    server.stop();
    smtp.close();
  });

  await t.test("7b. a refusal at the sender or recipient stage fails honestly, and silence times out", async () => {
    /* The mail server accepting the connection and then refusing the envelope
     * is a different failure from not reaching it at all, and a different code
     * path in the client. Both must end as an honest failure. */
    const stages = [
      ["the sender address is refused", { rejectMailFrom: true }, /550|Sender address rejected/i],
      ["the recipient address is refused", { rejectRcptTo: true }, /550|Recipient address rejected/i],
    ];

    for (const [label, options, expected] of stages) {
      const smtp = await stagedSmtp(options);
      const cfg = env({ AERO_SMTP_PORT: String(smtp.port), AERO_SMTP_TIMEOUT: "5" });
      const server = await startPhp(cfg);

      const { status, json } = await postMultipart(server.url, "contact", contactPayload());
      assert.equal(status, 502, label);
      assert.equal(json.ok, false, `${label}: a refused message must never be reported as sent`);
      assert.match(json.message, /could not deliver/i, label);
      assert.ok(json.reference, `${label}: the enquiry keeps a reference so it is not lost silently`);
      assert.ok(!/550|smtp|mailbox/i.test(json.message), `${label}: the SMTP reply must not reach the visitor`);

      const failure = logEvents(cfg.AERO_LOG_FILE).find((e) => e.event === "delivery_failed");
      assert.ok(failure, `${label}: the refusal should be logged with the submission`);
      assert.match(JSON.stringify(failure), expected, label);

      server.stop();
      smtp.close();
    }

    /* A server that accepts the connection and then says nothing must hit the
     * read timeout rather than hanging: the form cannot be left waiting on a
     * socket that will never answer. */
    const quiet = await stagedSmtp({ silent: true });
    const quietEnv = env({ AERO_SMTP_PORT: String(quiet.port), AERO_SMTP_TIMEOUT: "5" });
    const server = await startPhp(quietEnv);

    const started = Date.now();
    const { status, json } = await postMultipart(server.url, "contact", contactPayload());
    const took = Date.now() - started;

    assert.equal(status, 502, "a silent server is a delivery failure");
    assert.match(json.message, /could not deliver/i);
    assert.ok(took < 30_000, `the read timeout must fire rather than hang (took ${took} ms)`);

    const failure = logEvents(quietEnv.AERO_LOG_FILE).find((e) => e.event === "delivery_failed");
    assert.match(JSON.stringify(failure), /timed out|No reply/i, "the log should name the timeout");

    server.stop();
    quiet.close();
  });

  /* ── 11. JSON responses ──────────────────────────────────────────────── */

  await t.test("11. responses are valid, uncacheable JSON with the expected shape", async () => {
    const { res } = await postMultipart(api.url, "contact", contactPayload());
    assert.match(res.headers.get("content-type") ?? "", /application\/json/);
    assert.match(res.headers.get("cache-control") ?? "", /no-store/);
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");

    const bad = await postRaw(api.url, "contact", JSON.stringify({ form: "contact" }), {
      headers: { "Content-Type": "application/json" },
    });
    assert.equal(bad.status, 422);
    assert.equal(bad.json.ok, false);
    assert.equal(typeof bad.json.message, "string");
  });

  /* ── 14. Origin checks and the honeypot ──────────────────────────────── */

  await t.test("14a. a foreign origin is refused and a known one accepted", async () => {
    const foreign = await postMultipart(api.url, "contact", contactPayload(), {
      headers: { Origin: "https://evil.example" },
    });
    assert.equal(foreign.status, 403);

    const known = await postMultipart(api.url, "contact", contactPayload(), {
      headers: { Origin: "http://localhost:4201" },
    });
    assert.equal(known.status, 200);
    assert.equal(known.res.headers.get("access-control-allow-origin"), "http://localhost:4201");
  });

  await t.test("14b. the honeypot and the timing trap are answered without sending", async () => {
    await clearMail();
    const honeypot = await postMultipart(api.url, "contact", contactPayload({ website: "http://spam.example" }));
    assert.equal(honeypot.status, 200);
    assert.equal(honeypot.json.ok, true, "a bot must not learn it was caught");

    const tooQuick = await postMultipart(api.url, "contact", contactPayload({ elapsed: "120" }));
    assert.equal(tooQuick.status, 200);
    assert.equal(tooQuick.json.ok, true);

    assert.equal((await captured()).length, 0, "neither trap may produce mail");
    assert.ok(logEvents(localEnv.AERO_LOG_FILE).some((e) => e.event === "bot_discarded"));
  });

  /* ── Attachments ────────────────────────────────────────────────────── */

  await t.test("attachments: a permitted file is carried, a disguised one is refused", async () => {
    await clearMail();
    const ok = await postMultipart(api.url, "contact", contactPayload(), {
      files: [{ name: "spec.txt", type: "text/plain", data: "500 GSM jacquard, 70x140cm" }],
    });
    assert.equal(ok.status, 200, JSON.stringify(ok.json));

    const [notification] = await captured();
    assert.equal(notification.Attachments?.length, 1, "the attachment should arrive");
    assert.ok(
      JSON.stringify(notification.Attachments[0]).includes("spec.txt"),
      `the attachment should keep its name: ${JSON.stringify(notification.Attachments[0])}`
    );

    await clearMail();
    // A PHP file claiming to be a PDF: finfo decides, not the browser.
    const disguised = await postMultipart(api.url, "contact", contactPayload(), {
      files: [{ name: "invoice.pdf", type: "application/pdf", data: "<?php system($_GET['c']); ?>" }],
    });
    assert.equal(disguised.status, 422);
    assert.ok(disguised.json.errors?.files);
    assert.equal((await captured()).length, 0);
  });

  /* ── 13. Runtime-file and library access restrictions ────────────────── */

  await t.test("13a. every library file refuses to run on its own", async () => {
    const files = ["config.php", "guard.php", "request.php", "uploads.php", "mailer.php", "forms.php", "mailmode.php"];
    for (const file of files) {
      const res = await fetch(`${api.url}/api/lib/${file}`);
      assert.equal(res.status, 404, `api/lib/${file} must not answer`);
      const body = await res.text();
      assert.ok(!body.includes("smtp_pass"), `api/lib/${file} must not disclose configuration`);
    }
  });

  await t.test("13b. the deployed IIS and Apache rules deny the private paths", () => {
    const webConfig = path.join(ROOT, "public", "web.config");
    assert.equal(xmlIsValid(webConfig), "VALID", "web.config must be well-formed XML");

    const iis = fs.readFileSync(webConfig, "utf8");
    assert.match(iis, /existingResponse="PassThrough"/, "IIS must not replace the endpoint's JSON");
    assert.match(iis, /statusCode="404"[\s\S]*?responseMode="File"/, "a real 404 must keep its status");
    for (const denied of ["lib", "data", "logs", "config.php", "aero-config.php"]) {
      assert.match(iis, new RegExp(`<add segment="${denied.replace(".", "\\.")}"`), `IIS must hide ${denied}`);
    }
    assert.match(iis, /fileExtension="\.log"/, "the submission log must not be servable");

    const htaccess = fs.readFileSync(path.join(ROOT, "public", "api", ".htaccess"), "utf8");
    for (const denied of ["lib", "data", "logs"]) {
      assert.match(htaccess, new RegExp(`^RedirectMatch 404 \\^/api/${denied}/`, "m"), `Apache must hide /api/${denied}/`);
    }
    // The credentials file, whatever it is called: config.php, and the two
    // example templates beside it.
    assert.match(htaccess, /^RedirectMatch 404 \^\/api\/config\[\^\/\]\*\\\.php\$$/m);
    assert.match(htaccess, /<FilesMatch "\^\(config\[\^\/\]\*\\\.php\)\$">/);
  });

  /* ── 16, 17 & 18. Mode isolation and the approval transitions ────────── */

  await t.test("16. a demo cannot reach a real mailbox even when told to", async () => {
    const cases = [
      [
        "the company inbox cannot be set as a demo recipient",
        env({ AERO_MAIL_TO: "export@aerocotton.in" }),
        /not a reserved test address/i,
      ],
      [
        "a provider host cannot be used in local mode",
        env({ AERO_SMTP_HOST: "smtp.gmail.com" }),
        /not this machine/i,
      ],
      [
        "the reviewer inbox cannot be set as a demo recipient",
        env({ AERO_MAIL_TO: "jeinfonet@gmail.com" }),
        /not a reserved test address/i,
      ],
    ];

    await clearMail();

    for (const [label, cfg, expectedProblem] of cases) {
      const server = await startPhp(cfg);
      const { status, json } = await postMultipart(server.url, "contact", contactPayload());
      assert.equal(status, 503, label);
      assert.equal(json.ok, false, label);

      // The visitor gets one honest, non-specific sentence; the reason — which
      // names settings — goes only to the server-side log.
      const problems = logEvents(cfg.AERO_LOG_FILE).find((e) => e.event === "mail_mode_blocked")?.problems ?? [];
      assert.ok(
        problems.some((p) => expectedProblem.test(p)),
        `${label}: expected a problem matching ${expectedProblem}, got ${JSON.stringify(problems)}`
      );
      server.stop();
    }

    assert.equal((await captured()).length, 0, "no demo may have delivered anything");
  });

  await t.test("17. sample review and production delivery each need their own approval", async () => {
    /* Sample review, approved: goes to the reviewer, not the company inbox. */
    await clearMail();
    // These two scenarios need a real SMTP exchange, and the only SMTP server
    // in this environment is on loopback. `mail_allow_loopback_relay` is the
    // explicit, documented escape hatch for exactly that: the connectivity is
    // real, the routing and the approval gates are real, and health.php reports
    // the relay setting as a warning. A live provider connection is NOT
    // verified by this and is listed as unverified in TEST_REPORT.md.
    const sampleEnv = env({
      AERO_MAIL_MODE: "sample",
      AERO_MAIL_SAMPLE_APPROVED: "1",
      AERO_MAIL_ALLOW_LOOPBACK_RELAY: "1",
      AERO_SMTP_HOST: "127.0.0.1",
      AERO_SMTP_PORT: String(activeSmtpPort()),
      AERO_SMTP_ENCRYPTION: "",
      AERO_SMTP_USER: "mailbox@aerocotton.test",
      AERO_SMTP_PASS: "sample-review-password",
    });
    const sample = await startPhp(sampleEnv);
    const sampleResult = await postMultipart(sample.url, "contact", contactPayload({ name: "Sample Reviewer" }));
    assert.equal(sampleResult.status, 200, JSON.stringify(sampleResult.json));
    assert.equal(sampleResult.json.mailMode, "sample");

    assert.equal(await waitForMailCount(2), 2);
    for (const message of await captured()) {
      assert.deepEqual(recipientsOf(message), ["jeinfonet@gmail.com"], "a sample goes to the reviewer only");
      assert.match(message.Subject, /^\[SAMPLE FOR REVIEW\] /);
      assert.match(summaryText(message), /SAMPLE FOR REVIEW/);
    }
    sample.stop();

    /* Production, approved: goes to the company inbox, and the visitor gets a copy. */
    await clearMail();
    const prodEnv = env({
      AERO_MAIL_MODE: "production",
      AERO_MAIL_PRODUCTION_APPROVED: "1",
      AERO_MAIL_ALLOW_LOOPBACK_RELAY: "1",
      AERO_SMTP_HOST: "127.0.0.1",
      AERO_SMTP_PORT: String(activeSmtpPort()),
      AERO_SMTP_ENCRYPTION: "",
      AERO_SMTP_USER: "mailbox@aerocotton.test",
      AERO_SMTP_PASS: "production-password",
    });
    const prod = await startPhp(prodEnv);
    const prodResult = await postMultipart(prod.url, "contact", contactPayload({ email: "customer@buyer.example" }));
    assert.equal(prodResult.status, 200, JSON.stringify(prodResult.json));
    assert.equal(prodResult.json.mailMode, "production");

    assert.equal(await waitForMailCount(2), 2);
    const sent = await captured();
    const notification = sent.find((m) => recipientsOf(m).includes("export@aerocotton.in"));
    const confirmation = sent.find((m) => recipientsOf(m).includes("customer@buyer.example"));
    assert.ok(notification, "the company inbox receives the notification");
    assert.ok(confirmation, "the visitor receives the acknowledgement in production");
    assert.ok(!notification.Subject.startsWith("[SAMPLE"), "production mail carries no review banner");
    prod.stop();
  });

  await t.test("18. nothing in this suite left a real recipient on the wire", async () => {
    const all = await captured();
    const real = all.filter((message) =>
      recipientsOf(message).some((address) => address === "export@aerocotton.in" || address === "jeinfonet@gmail.com")
    );

    // Exactly the two production assertions above are allowed to address the
    // real company inbox, and they were delivered to the loopback capture
    // server — which is why they are indistinguishable from any other capture.
    // Anything beyond those two would mean something else reached out.
    assert.ok(real.length <= 2, `unexpected real-address deliveries: ${JSON.stringify(real.map(recipientsOf))}`);
  });

  /* ── 9. Health checks ────────────────────────────────────────────────── */

  await t.test("9a. the health endpoint hides itself until a token is configured", async () => {
    const res = await fetch(`${api.url}/api/health.php`);
    assert.equal(res.status, 404);
    assert.equal((await res.text()).trim(), "Not Found");

    const wrong = await fetch(`${api.url}/api/health.php?token=guess`);
    assert.equal(wrong.status, 404);
  });

  await t.test("9b. with a token it separates configuration, connectivity, acceptance and delivery", async () => {
    // A password with no username: the mailer then skips AUTH, which is what a
    // local capture server wants — and still exercises the masking of a secret.
    const healthEnv = env({ AERO_HEALTH_TOKEN: "test-token-0123456789", AERO_SMTP_PASS: "another-secret-value" });
    const server = await startPhp(healthEnv);
    const before = (await captured()).length;

    const res = await fetch(`${server.url}/api/health.php?token=test-token-0123456789`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.checks.configuration.ok, true);
    assert.equal(body.checks.message_acceptance.ok, null, "the health check never claims to have sent mail");
    assert.equal(body.checks.inbox_delivery.ok, null, "inbox delivery cannot be observed from the server");

    assert.equal(body.report.mail.delivery_enabled, true);
    assert.equal(body.report.mail.mode, "local");
    assert.equal(body.report.config.smtp_pass.set, true);
    assert.equal(typeof body.report.config.smtp_pass.length, "number");

    const raw = JSON.stringify(body);
    assert.ok(!raw.includes("another-secret-value"), "the health report must never print a password");
    assert.ok(!raw.includes("test-token-0123456789"), "the report must not echo the health token");

    /* And the probe reports a stage without sending anything. */
    const probed = await (await fetch(`${server.url}/api/health.php?token=test-token-0123456789&probe=1`)).json();
    assert.equal(probed.probe.attempted, true);
    assert.equal(probed.probe.ok, true);
    assert.equal(probed.probe.stopped_at, "authenticated");
    assert.equal((await captured()).length, before, "a probe must not deliver mail");
    server.stop();
  });

  /* ── 12. IIS compatibility of the shipped configuration ──────────────── */

  await t.test("12. the IIS configuration is shaped for this endpoint", () => {
    const iis = fs.readFileSync(path.join(ROOT, "public", "web.config"), "utf8");
    assert.match(iis, /<defaultDocument[\s\S]*?index\.html/, "the export relies on index.html as the default document");
    assert.match(iis, /existingResponse="PassThrough"/);
    // Removing the status code first keeps IIS from refusing a duplicate rule.
    assert.match(iis, /<remove statusCode="404" \/>/);
    assert.match(iis, /<remove fileExtension="\.json" \/>/);
    assert.ok(!/responseMode="ExecuteURL"/.test(iis), "ExecuteURL would turn a missing page into a 200");
  });

  /* ── 19. No shipped file offers an unverified setting ────────────────── */

  await t.test("19. every shipped configuration leaves the mailbox blank", () => {
    const apiDir = path.join(ROOT, "public", "api");
    const shipped = [
      ...fs.readdirSync(apiDir).filter((f) => f.endsWith(".php")),
      ...fs.readdirSync(path.join(apiDir, "lib")).filter((f) => f.endsWith(".php")).map((f) => `lib/${f}`),
    ];

    for (const name of shipped) {
      const text = fs.readFileSync(path.join(apiDir, name), "utf8");

      // The hostname the shipped export assumed, and that does not resolve.
      assert.ok(
        !text.includes("mail.aerocotton.in"),
        `${name}: the invented SMTP host must not reappear in anything we ship`
      );

      // A shipped file may only ever carry a blank mailbox setting. A
      // placeholder is not blank — it reads as a value, so the endpoint would
      // report "cannot reach the mail server" for what is really an unset key.
      for (const [, key, value] of text.matchAll(/'(smtp_host|smtp_user|smtp_pass)'\s*=>\s*'([^']*)'/g)) {
        assert.equal(value, "", `${name}: ${key} must ship blank, found ${JSON.stringify(value)}`);
      }
    }

    // The loader's own defaults: no host, no port, no credentials.
    const loader = fs.readFileSync(path.join(apiDir, "lib", "config.php"), "utf8");
    assert.match(loader, /'smtp_host'\s*=>\s*''/);
    assert.match(loader, /'smtp_port'\s*=>\s*0/);
    assert.match(loader, /'smtp_user'\s*=>\s*''/);
    assert.match(loader, /'smtp_pass'\s*=>\s*''/);
    assert.match(loader, /'health_token'\s*=>\s*''/);

    // Neither approval is ever pre-granted in a shipping file.
    for (const name of ["config.local.example.php", "config.production.example.php"]) {
      const text = fs.readFileSync(path.join(apiDir, name), "utf8");
      for (const flag of ["mail_sample_approved", "mail_production_approved"]) {
        const assignment = text.match(new RegExp(`'${flag}'\\s*=>\\s*(\\w+)`));
        if (assignment) assert.equal(assignment[1], "false", `${name}: ${flag} must ship false`);
      }
    }
  });

  /* ── 20. The documented environment-variable interface ───────────────── */

  await t.test("20. the documented AERO_* names are the ones the endpoint reads", async () => {
    await clearMail();

    const envOnly = env({
      AERO_MAIL_MODE: "local",
      AERO_SMTP_HOST: "127.0.0.1",
      AERO_SMTP_PORT: String(activeSmtpPort()),
      AERO_SMTP_ENCRYPTION: "",
      AERO_SMTP_USER: "",
      AERO_SMTP_PASS: "env-only-secret-value",
      AERO_MAIL_FROM: "envsender@aerocotton.test",
      AERO_MAIL_TO: "envrecipient@aerocotton.test",
      AERO_HEALTH_TOKEN: "env-token-0123456789abcd",
    });
    const server = await startPhp(envOnly);

    // AERO_MAIL_TO and AERO_MAIL_FROM must reach the wire, not just the config
    // array: the message is read back out of the capture server.
    const { status, json } = await postMultipart(server.url, "contact", contactPayload());
    assert.equal(status, 200, JSON.stringify(json));
    assert.equal(await waitForMailCount(2), 2);

    for (const message of await captured()) {
      assert.deepEqual(
        recipientsOf(message),
        ["envrecipient@aerocotton.test"],
        "AERO_MAIL_TO must set the recipient"
      );
      assert.equal(
        fromOf(message),
        "Aerocotton Website <envsender@aerocotton.test>",
        "AERO_MAIL_FROM must set the sender"
      );
    }

    // And the same values are what health.php reports — including the
    // environment-only password, as a presence flag rather than a value.
    const health = await fetch(`${server.url}/api/health.php?token=env-token-0123456789abcd`);
    assert.equal(health.status, 200, "AERO_HEALTH_TOKEN must unlock the health page");
    const body = await health.json();

    assert.equal(body.report.mail.mode, "local", "AERO_MAIL_MODE must set the mode");
    assert.equal(body.report.mail.recipient, "envrecipient@aerocotton.test");
    assert.equal(body.report.mail.sender, "envsender@aerocotton.test");
    assert.equal(body.report.mail.smtp.host, "127.0.0.1", "AERO_SMTP_HOST must set the host");
    assert.equal(body.report.mail.smtp.port, activeSmtpPort(), "AERO_SMTP_PORT must set the port");
    assert.equal(body.report.mail.smtp.password_set, true, "AERO_SMTP_PASS must be seen");
    assert.equal(body.report.config.source, "defaults", "no config file exists: these came from the environment");

    const raw = JSON.stringify(body);
    assert.ok(!raw.includes("env-only-secret-value"), "the password must never be printed");
    assert.ok(!raw.includes("env-token-0123456789abcd"), "the token must not be echoed back");
    server.stop();
  });

  /* ── 15. The site itself still serves ────────────────────────────────── */

  await t.test("15. the exported site still answers for its own routes", async () => {
    const { serveExport } = await import("./lib/export-server.mjs");
    const site = await serveExport();
    t.after(() => site.stop());

    const routes = ["/", "/contact/", "/about/", "/products/", "/support/", "/customer-care/"];
    for (const route of routes) {
      const res = await fetch(`${site.url}${route}`);
      assert.equal(res.status, 200, `${route} should serve`);
      assert.match(res.headers.get("content-type") ?? "", /text\/html/);
    }

    const contact = await (await fetch(`${site.url}/contact/`)).text();
    for (const field of ["name", "company", "email", "country", "interest", "message"]) {
      assert.ok(contact.includes(`name="${field}"`), `the contact form should still render ${field}`);
    }

    const missing = await fetch(`${site.url}/definitely-not-a-page/`);
    assert.equal(missing.status, 404);

    // The preview is what a developer clicks through before uploading, and the
    // site's forms only work if the endpoint executes. It used to answer with
    // the endpoint's own source as `application/octet-stream`, which the form
    // reported as "the enquiry service is not responding" — a false alarm
    // caused by the preview. Whatever the outcome, it must be JSON.
    const endpoint = await fetch(`${site.url}/api/submit.php?form=contact`);
    assert.match(
      endpoint.headers.get("content-type") ?? "",
      /application\/json/,
      "the preview must never hand out PHP as a file"
    );
    const body = await endpoint.text();
    assert.ok(!body.startsWith("<?php"), "the preview served the endpoint's source");
    JSON.parse(body);

    // Configuration and libraries are private on the host, and here too.
    for (const privatePath of ["/api/config.example.php", "/api/lib/config.php"]) {
      const res = await fetch(`${site.url}${privatePath}`);
      assert.equal(res.status, 404, `${privatePath} must not be served`);
    }
  });
});

/* Small helpers kept next to their use. */

/** A captured message's plain-text part, which is what most assertions read. */
function summaryText(message) {
  return message.Text ?? message.Snippet ?? "";
}
