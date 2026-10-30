/**
 * Test harness: a real PHP server and a real SMTP capture server.
 *
 * Nothing here is mocked. Each scenario starts `php -S` with its own
 * environment — which is how the mail-mode tests get a different
 * configuration without touching a file — and every message that the endpoint
 * claims to have sent is read back out of Mailpit.
 *
 * Nothing is sent anywhere except into Mailpit on loopback. The suite asserts
 * that for itself; see "prevention of unauthorised real email delivery".
 */
import { spawn } from "node:child_process";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Scratch directory for test logs. Git-ignored; never inside the export. */
export const WORK = path.join(ROOT, ".pdf-work");

/** The bundled developer tooling, then anything on PATH. */
function firstExisting(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export const PHP =
  process.env.AERO_PHP ||
  firstExisting([path.join(ROOT, ".pdf-work", "tools", "php", "php.exe")]) ||
  "php";

export const MAILPIT =
  process.env.AERO_MAILPIT ||
  firstExisting([path.join(ROOT, ".pdf-work", "tools", "mailpit", "mailpit.exe")]) ||
  "mailpit";

//
// The capture server is started on ports the OS picks, so a developer's own
// Mailpit on 1025/8025 — or a stale one from an interrupted run — can never be
// mistaken for this suite's. Both are loopback only.
let smtpPort = Number(process.env.AERO_TEST_SMTP_PORT || 0);
let mailpitBase = process.env.AERO_TEST_MAILPIT_URL || "";

/** The SMTP port the running capture server is listening on. */
export function activeSmtpPort() {
  return smtpPort;
}

/** The inbox URL of the running capture server. */
export function activeMailpitUrl() {
  return mailpitBase;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A port nobody is listening on, so two servers in one run never collide. */
export async function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function reachable(port, host = "127.0.0.1", timeoutMs = 300) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.on("connect", () => done(true));
    socket.on("error", () => done(false));
  });
}

/** Wait until something answers HTTP on the port, or give up loudly. */
async function waitForHttp(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url, { method: "GET" });
      return true;
    } catch {
      await sleep(120);
    }
  }
  return false;
}

/* ── Mailpit ─────────────────────────────────────────────────────────────── */

let mailpitProcess = null;
let mailpitOwned = false;

/**
 * Start this suite's own Mailpit and return its inbox URL.
 *
 * `--smtp-auth-accept-any` with `--smtp-auth-allow-insecure` makes it advertise
 * AUTH and accept any credentials over the plaintext session, which is what
 * lets the sample-review and approved-production scenarios complete a real
 * authenticated SMTP exchange. It never leaves loopback.
 */
export async function startMailpit() {
  if (!smtpPort) smtpPort = await freePort();
  if (!mailpitBase) {
    const httpPort = await freePort();
    mailpitBase = `http://127.0.0.1:${httpPort}`;
  }

  mailpitProcess = spawn(
    MAILPIT,
    [
      "--smtp", `127.0.0.1:${smtpPort}`,
      "--listen", mailpitBase.replace(/^https?:\/\//, ""),
      "--database", path.join(os.tmpdir(), `aero-mailpit-${process.pid}.db`),
      "--smtp-auth-accept-any",
      "--smtp-auth-allow-insecure",
    ],
    { stdio: ["ignore", "pipe", "pipe"], detached: false }
  );
  mailpitOwned = true;
  mailpitProcess.on("error", () => {});

  if (!(await waitForHttp(`${mailpitBase}/api/v1/messages`))) {
    throw new Error(`Mailpit did not come up on ${mailpitBase} (binary: ${MAILPIT})`);
  }
  return mailpitBase;
}

export function stopMailpit() {
  if (mailpitOwned && mailpitProcess) {
    mailpitProcess.kill();
    mailpitProcess = null;
  }
}

/** Empty the capture inbox so each scenario's assertions are unambiguous. */
export async function clearMail() {
  await fetch(`${mailpitBase}/api/v1/messages`, { method: "DELETE" });
}

/** The message list, newest last. */
export async function capturedList() {
  const res = await fetch(`${mailpitBase}/api/v1/messages`);
  const json = await res.json();
  // Mailpit returns newest first; the assertions read better oldest first.
  return (json.messages ?? []).slice().reverse();
}

/** One captured message in full, or null. */
export async function capturedOne(id) {
  const res = await fetch(`${mailpitBase}/api/v1/message/${id}`);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Every captured message, newest last — headers, both MIME parts and
 * attachments included, because that is what the assertions need to read.
 */
export async function captured() {
  const list = await capturedList();
  return Promise.all(list.map((item) => capturedOne(item.ID)));
}

/** The single captured message, failing loudly if there is not exactly one. */
export async function onlyCaptured() {
  const list = await captured();
  if (list.length !== 1) {
    throw new Error(`expected exactly 1 captured message, found ${list.length}`);
  }
  return list[0];
}

/**
 * Wait until the capture inbox holds `count` messages. The endpoint returns
 * after SMTP has accepted the message, but the capture store is written from
 * another process, so a short poll avoids a race without hiding a failure.
 */
export async function waitForMailCount(count, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let last = -1;
  while (Date.now() < deadline) {
    last = (await captured()).length;
    if (last >= count) return last;
    await sleep(80);
  }
  return last;
}

/* ── PHP server ──────────────────────────────────────────────────────────── */

const servers = new Set();

/**
 * Start `php -S` serving the `public/` tree, with `env` layered over the
 * process environment. Returns { url, stop }.
 */
export async function startPhp(env = {}, { args = [] } = {}) {
  const port = await freePort();
  const docRoot = path.join(ROOT, "public");

  // The error-log path is RELATIVE to the project root (the spawn cwd) on
  // purpose, so the -d value contains no drive letter, space, bracket or
  // parenthesis. PHP's -d parser rejects those characters with "syntax error,
  // unexpected '(' in Unknown" and then silently ignores every -d option after
  // it — which quietly removed post_max_size from the server this suite was
  // testing, so a truncated upload looked like a field-validation failure. This
  // project's own root path contains spaces and brackets, so an absolute path
  // is not safe here. Verified by probing ini_get() with each argv shape.
  const errorLog = path.relative(ROOT, path.join(WORK, "test-php-error.log")).split(path.sep).join("/");
  fs.mkdirSync(WORK, { recursive: true });

  const child = spawn(
    PHP,
    [
      "-d", "display_errors=0",
      "-d", `error_log=${errorLog}`,
      ...args,
      "-S", `127.0.0.1:${port}`,
      "-t", path.relative(ROOT, docRoot),
    ],
    {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  let stderr = "";
  child.stderr.on("data", (d) => { stderr += d.toString(); });
  child.stdout.on("data", () => {});
  child.on("error", () => {});

  const url = `http://127.0.0.1:${port}`;
  const ok = await waitForHttp(`${url}/api/health.php`, 15000);
  if (!ok) {
    child.kill();
    throw new Error(`php -S did not start on ${url}\n${stderr}`);
  }

  const server = {
    url,
    port,
    stop() {
      servers.delete(server);
      child.kill();
    },
    stderr: () => stderr,
  };
  servers.add(server);
  return server;
}

export function stopAllServers() {
  for (const server of [...servers]) server.stop();
}

/* ── Small helpers ───────────────────────────────────────────────────────── */

/** A valid contact-form payload, with overrides applied. */
export function contactPayload(overrides = {}) {
  return {
    form: "contact",
    name: "Priya Raman",
    company: "Sunrise Home Textiles",
    email: "priya@sunrise-textiles.example",
    phone: "+91 98765 43210",
    country: "India",
    interest: "Private label / OEM",
    message:
      "We are looking for 3,000 units of a 500 GSM jacquard bath towel set, custom colours, for a Q1 launch. Please send sampling lead times and pricing.",
    website: "",
    elapsed: "9000",
    ...overrides,
  };
}

/** A valid support-form payload. */
export function supportPayload(overrides = {}) {
  return {
    form: "support",
    name: "Arun Kumar",
    company: "Blue Harbor Retail",
    email: "arun@blueharbor.example",
    phone: "",
    orderId: "AH-2026-000042",
    category: "Delivery or shipment",
    priority: "High",
    subject: "Shipment delayed at Chennai",
    description:
      "The consignment has been sitting at the port for six days and our customer is asking for a revised delivery date.",
    website: "",
    elapsed: "8000",
    ...overrides,
  };
}

/** POST a multipart submission the way the browser form does. */
export async function postMultipart(baseUrl, form, payload, { headers = {}, files = [] } = {}) {
  const body = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (key === "form") continue;
    body.append(key, value == null ? "" : String(value));
  }
  for (const file of files) {
    body.append("files[]", new Blob([file.data], { type: file.type }), file.name);
  }

  const res = await fetch(`${baseUrl}/api/submit.php?form=${form}`, {
    method: "POST",
    body,
    headers,
  });
  return { status: res.status, json: await res.json().catch(() => null), res };
}

/** POST a raw body (JSON or malformed) with an explicit content type. */
export async function postRaw(baseUrl, form, rawBody, { headers = {}, method = "POST" } = {}) {
  const res = await fetch(`${baseUrl}/api/submit.php?form=${form}`, {
    method,
    body: rawBody,
    headers,
  });
  return { status: res.status, json: await res.json().catch(() => null), res };
}

/**
 * Addresses a captured message was delivered to.
 *
 * Mailpit reports the SMTP envelope recipient under `Bcc` when a message has no
 * matching To/Cc header, so all three buckets are read as one set.
 */
export function recipientsOf(full) {
  const out = new Set();
  for (const bucket of ["To", "Cc", "Bcc"]) {
    for (const entry of full[bucket] ?? []) {
      if (entry?.Address) out.add(entry.Address.toLowerCase());
    }
  }
  return [...out];
}

/** The parsed Reply-To addresses, lower-cased. */
export function replyToOf(full) {
  return (full.ReplyTo ?? []).map((entry) => String(entry?.Address ?? "").toLowerCase()).filter(Boolean);
}

/** "Name <address>" for the From header, as the recipient would see it. */
export function fromOf(full) {
  const address = full.From?.Address ?? "";
  const name = full.From?.Name ?? "";
  return name ? `${name} <${address}>` : address;
}

export { sleep };
