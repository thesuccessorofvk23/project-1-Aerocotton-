#!/usr/bin/env node
/**
 * Local mail stack: the SMTP capture server and the PHP endpoint.
 *
 *     npm run mail:start                      Mailpit + PHP, capture mode
 *     npm run mail:start -- --mode sample     the same stack, in sample mode
 *     npm run mail:status                     what is running, and in which mode
 *     npm run mail:stop                       stop both
 *
 * The two processes are started detached with their output in `.pdf-work/`, so
 * they keep running after this command returns and can be stopped from another
 * shell. PIDs are recorded in `.pdf-work/dev-stack.json`; only processes this
 * script started are ever stopped.
 *
 * Nothing here is reachable from outside this machine, and nothing here can
 * reach a person:
 *
 *   - Mailpit binds 127.0.0.1 for both SMTP and its inbox, and is started with
 *     **no relay and no forwarding flag of any kind**, so a captured message
 *     has nowhere to go.
 *   - `--smtp-allowed-recipients` makes the capture server itself refuse any
 *     recipient outside the reserved test domains, using the same rule as
 *     `aero_address_is_reserved_for_testing()` in `public/api/lib/mailmode.php`.
 *   - `local` mode additionally makes the *endpoint* refuse any recipient that
 *     is not a reserved test address and any SMTP host that is not loopback.
 *
 * Authentication follows the mode, because the two modes need opposite things —
 * measured, not assumed:
 *
 *   local   the endpoint sends **no** credentials (smtp_user is blank by
 *           design), so the capture server must accept an unauthenticated
 *           session. Mailpit with a password file refuses one.
 *   sample  the endpoint refuses to send at all unless a mailbox is configured,
 *           so it always authenticates. With a password file the capture server
 *           verifies it for real: the right password is accepted, a wrong one is
 *           refused with 535 — which `--smtp-auth-accept-any` could never show.
 *
 * Mailpit rejects `--smtp-auth-file` together with `--smtp-auth-accept-any`
 * ("authentication cannot use both credentials and --smtp-auth-accept-any"), so
 * one configuration genuinely cannot serve both modes. Starting a capture server
 * for one mode and reusing it for the other would fail at the first send, so
 * this script refuses to reuse a capture server it did not start for the
 * requested mode.
 *
 * `--mode sample` points the endpoint at the reviewer's *reserved test* address,
 * never at the real reviewer, so the local stack rehearses the routing and the
 * approval gate without addressing anyone. It will not start `--mode production`:
 * a real send needs the real mailbox and belongs on the server.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORK = path.join(ROOT, ".pdf-work");
const STATE = path.join(WORK, "dev-stack.json");
const AUTH_FILE = path.join(WORK, "mailpit-auth.txt");

const SMTP_PORT = Number(process.env.AERO_DEV_SMTP_PORT || 1025);
const INBOX_PORT = Number(process.env.AERO_DEV_INBOX_PORT || 8025);
const API_PORT = Number(process.env.AERO_DEV_API_PORT || 8787);

/**
 * The local capture server's own credentials. Synthetic: invented for local
 * capture, never the company mailbox, and written only to the git-ignored
 * password file below. Sample mode is configured with the same pair, so the
 * authenticated exchange is genuine — which also means a wrong password is
 * really rejected (535), exactly as it would be in production.
 */
const LOCAL_SMTP_USER = "sample-review@aerocotton.test";
const LOCAL_SMTP_PASS = "local-capture-only";

/** Local sample run's recipient: reserved for testing, cannot belong to a person. */
const LOCAL_SAMPLE_TO = "sample-review@aerocotton.test";

/**
 * The reserved names that can never belong to a person, mirroring
 * `aero_address_is_reserved_for_testing()` in public/api/lib/mailmode.php.
 * Keep the two in step: the endpoint gate and the capture server's recipient
 * filter are built from this same set, so neither can drift from the other.
 */
const RESERVED_TEST_SUFFIXES = ["test", "invalid", "example", "localhost"];
const RESERVED_TEST_DOMAINS = ["example.com", "example.org", "example.net", "localhost.localdomain"];

const argv = process.argv.slice(2);
const command = (argv.find((a) => !a.startsWith("--")) || "start").toLowerCase();
const modeFlag = argv.includes("--mode") ? argv[argv.indexOf("--mode") + 1] : null;
const MODE = String(modeFlag || process.env.AERO_MAIL_MODE || "local").toLowerCase();
const NEEDS_AUTH = MODE === "sample";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function firstExisting(candidates) {
  for (const candidate of candidates) if (candidate && fs.existsSync(candidate)) return candidate;
  return null;
}

const PHP =
  process.env.AERO_PHP ||
  firstExisting([path.join(WORK, "tools", "php", "php.exe")]) ||
  "php";

const MAILPIT =
  process.env.AERO_MAILPIT ||
  firstExisting([path.join(WORK, "tools", "mailpit", "mailpit.exe")]) ||
  "mailpit";

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE, "utf8"));
  } catch {
    return { mailpit: null, api: null, mode: null, captureAuth: null };
  }
}

function writeState(state) {
  fs.mkdirSync(WORK, { recursive: true });
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n");
}

async function listening(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.setTimeout(300, () => resolve(false));
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

async function waitForHttp(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
      return true;
    } catch {
      await sleep(150);
    }
  }
  return false;
}

/**
 * Does whatever is listening on the capture port advertise SMTP AUTH?
 *
 * Read-only: an EHLO, then QUIT. No message is ever sent, so this is safe to run
 * against a server this script did not start — and the answer is what turns "the
 * send failed for some reason" into "this capture server cannot serve this mode".
 */
async function captureAdvertisesAuth(timeoutMs = 3000) {
  return new Promise((resolve) => {
    const socket = net.connect({ port: SMTP_PORT, host: "127.0.0.1" });
    let buffer = "";
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      try {
        socket.destroy();
      } catch {}
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    socket.on("error", () => {
      clearTimeout(timer);
      finish(null);
    });
    socket.on("data", (d) => {
      buffer += d.toString();
      if (!/^220/m.test(buffer)) return;
      if (!/EHLO|sent/i.test(buffer)) socket.write("EHLO dev-stack.local\r\n");
      if (/^250-/m.test(buffer)) {
        clearTimeout(timer);
        finish(/^250[- ].*AUTH/m.test(buffer));
      }
    });
  });
}

/** Start a process detached, with its output going to a log file. */
function launch(name, bin, cmdArgs, env = process.env) {
  fs.mkdirSync(WORK, { recursive: true });
  const logPath = path.join(WORK, `${name}.log`);
  const log = fs.openSync(logPath, "a");
  const child = spawn(bin, cmdArgs, {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", log, log],
    env,
  });
  child.unref();
  return { pid: child.pid, log: logPath };
}

function alive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Stop a recorded process, and on Windows its children with it. */
function kill(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      try {
        process.kill(pid, "SIGTERM");
      } catch {}
    }
  }
}

/** Mirror of the endpoint's reserved-address rule — see the constant above. */
function isReservedTestAddress(email) {
  const at = String(email).lastIndexOf("@");
  if (at === -1) return false;
  const domain = String(email).slice(at + 1).toLowerCase();
  if (RESERVED_TEST_DOMAINS.includes(domain)) return true;
  return RESERVED_TEST_SUFFIXES.some((suffix) => domain === suffix || domain.endsWith(`.${suffix}`));
}

/** The same set as an RE2 pattern, for Mailpit's `--smtp-allowed-recipients`. */
function allowedRecipientsPattern() {
  const suffixes = RESERVED_TEST_SUFFIXES.join("|");
  const domains = RESERVED_TEST_DOMAINS.map((d) => d.replace(/\./g, "\\.")).join("|");
  return String.raw`(?i)@(([a-z0-9-]+\.)*(${suffixes})|${domains})$`;
}

/**
 * The capture server's flags for this mode.
 *
 * `--smtp-auth-file` with the stack's own synthetic pair is what makes sample
 * mode's credentials real; local mode must stay unauthenticated because the
 * endpoint sends nothing to authenticate with. There is deliberately no
 * `--smtp-relay-*` or `--smtp-forward-*` in either list.
 */
function mailpitArgs() {
  const args = [
    "--smtp", `127.0.0.1:${SMTP_PORT}`,
    "--listen", `127.0.0.1:${INBOX_PORT}`,
    "--database", path.join(WORK, "mailpit-data", "mailpit.db"),
    "--smtp-allowed-recipients", allowedRecipientsPattern(),
  ];
  if (NEEDS_AUTH) {
    fs.mkdirSync(WORK, { recursive: true });
    fs.writeFileSync(
      AUTH_FILE,
      `# Local capture credentials for the development stack. Synthetic, not a secret.\n` +
        `# Read only by Mailpit on 127.0.0.1; never the company mailbox. Git-ignored.\n` +
        `${LOCAL_SMTP_USER}:${LOCAL_SMTP_PASS}\n`
    );
    args.push("--smtp-auth-file", AUTH_FILE, "--smtp-auth-allow-insecure");
  }
  return args;
}

/**
 * Refuse before starting anything if this mode cannot be run safely on a laptop.
 * A clear message here is much better than a confusing SMTP failure later.
 */
function guardMode() {
  if (!["local", "sample"].includes(MODE)) {
    console.error(
      MODE === "production"
        ? `\nRefusing to start in "production" mode.\n` +
          `A real send needs the real mailbox credentials and belongs on the server:\n` +
          `see PRODUCTION_HANDOVER.md §4. The local stack only ever runs "local" or "sample".\n`
        : `\nUnknown mode "${MODE}". Use --mode local (capture) or --mode sample\n` +
          `(the review flow, rehomed to a reserved test inbox).\n`
    );
    process.exit(1);
  }

  const host = process.env.AERO_SMTP_HOST || "127.0.0.1";
  const loopback =
    ["localhost", "127.0.0.1", "::1", "localhost.localdomain"].includes(host.toLowerCase()) ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);

  if (MODE === "sample" && !loopback) {
    console.error(
      `\nRefusing to start sample mode against ${host}, which is not this machine.\n` +
        `The local stack is a capture server: it can only rehearse the flow, and it must\n` +
        `never be handed a real provider. Run the real sample from the server instead\n` +
        `(PRODUCTION_HANDOVER.md §4), or unset AERO_SMTP_HOST to use 127.0.0.1.\n`
    );
    process.exit(1);
  }

  const recipient =
    process.env.AERO_MAIL_TO || (MODE === "sample" ? LOCAL_SAMPLE_TO : "dev@aerocotton.test");
  if (!isReservedTestAddress(recipient)) {
    console.error(
      `\nRefusing to start: the recipient would be ${recipient}.\n` +
        `The capture server only accepts reserved test addresses (${RESERVED_TEST_SUFFIXES.map((s) => `.${s}`).join(", ")},\n` +
        `${RESERVED_TEST_DOMAINS.join(", ")}), so it would refuse this message at RCPT.\n` +
        `Use a reserved address, or clear AERO_MAIL_TO to use this mode's own inbox.\n`
    );
    process.exit(1);
  }
}

/**
 * A capture server already listening must match this mode's authentication, or
 * the first send fails for a reason that has nothing to do with the code.
 */
async function guardCaptureServer(state) {
  const recorded = state.captureAuth;
  const advertises = await captureAdvertisesAuth();

  if (recorded !== undefined && recorded !== null && recorded !== NEEDS_AUTH) {
    console.error(
      `\nA capture server is already listening on ${SMTP_PORT}, started by this tool for\n` +
        `"${recorded ? "sample" : "local"}" mode${recorded ? " (it requires authentication)" : " (it accepts unauthenticated mail)"},\n` +
        `and it cannot serve "${MODE}" mode: Mailpit's authentication setting is fixed at startup.\n` +
        `Run "npm run mail:stop", then start again.\n`
    );
    process.exit(1);
  }

  if ((recorded === undefined || recorded === null) && advertises === false && NEEDS_AUTH) {
    console.error(
      `\nA capture server is already listening on ${SMTP_PORT} but does not advertise SMTP AUTH,\n` +
        `so sample mode cannot authenticate against it. Stop it and let this tool start one:\n` +
        `"npm run mail:stop" first if this tool started it, otherwise close it and start again.\n`
    );
    process.exit(1);
  }

  if ((recorded === undefined || recorded === null) && advertises === true && !NEEDS_AUTH) {
    console.warn(
      `\nnote  the capture server already listening on ${SMTP_PORT} advertises SMTP AUTH and this\n` +
        `      tool did not start it, so its willingness to accept an unauthenticated session\n` +
        `      cannot be confirmed. If a local capture fails with an authentication error,\n` +
        `      stop it and rerun: "npm run mail:start".\n`
    );
  }

  return advertises;
}

/** The endpoint's environment for the requested mode. */
function apiEnv() {
  const base = {
    // Anything already set in your shell wins, so a deliberate override is
    // never clobbered — except the two capture credentials below, where the
    // pairing with the capture server IS the point.
    ...process.env,
    AERO_ENV: process.env.AERO_ENV || "development",
    AERO_MAIL_MODE: MODE,
    AERO_HEALTH_TOKEN: process.env.AERO_HEALTH_TOKEN || "local-demo",
    AERO_SMTP_HOST: process.env.AERO_SMTP_HOST || "127.0.0.1",
    AERO_SMTP_PORT: process.env.AERO_SMTP_PORT || String(SMTP_PORT),
  };

  if (NEEDS_AUTH) {
    for (const key of ["AERO_SMTP_USER", "AERO_SMTP_PASS"]) {
      if (process.env[key]) {
        console.log(
          `note  ${key} is set in this shell and is ignored: sample mode uses the local\n` +
            `      capture credentials so the password really is checked (a wrong one is\n` +
            `      refused with 535). Unset it if that surprises you.`
        );
      }
    }
    return {
      ...base,
      // The approval flag, the loopback escape hatch and the synthetic mailbox
      // are what `sample` mode needs. health.php reports the escape hatch as a
      // warning whenever it is on — that is deliberate, and it must never be
      // set on a host that can reach the internet.
      AERO_MAIL_SAMPLE_APPROVED: process.env.AERO_MAIL_SAMPLE_APPROVED || "1",
      AERO_MAIL_ALLOW_LOOPBACK_RELAY: "1",
      AERO_SMTP_ENCRYPTION: "",
      AERO_SMTP_USER: LOCAL_SMTP_USER,
      AERO_SMTP_PASS: LOCAL_SMTP_PASS,
      // Never the real reviewer: this is the local rehearsal of that flow.
      AERO_MAIL_TO: process.env.AERO_MAIL_TO || LOCAL_SAMPLE_TO,
    };
  }

  return base;
}

async function start() {
  guardMode();

  const state = readState();
  let authAdvertised = null;

  if (!(await listening(SMTP_PORT))) {
    if (!alive(state.mailpit?.pid)) {
      const started = launch("mailpit", MAILPIT, mailpitArgs());
      state.mailpit = started;
      state.captureAuth = NEEDS_AUTH;
      authAdvertised = NEEDS_AUTH;
      console.log(`mailpit     started  pid ${started.pid}  (log ${path.relative(ROOT, started.log)})`);
    }
  } else {
    authAdvertised = await guardCaptureServer(state);
    console.log(`mailpit     already listening on ${SMTP_PORT}`);
  }

  if (!(await listening(API_PORT))) {
    if (!alive(state.api?.pid)) {
      const started = launch(
        "api",
        PHP,
        [
          "-d", "display_errors=0",
          "-d", "log_errors=1",
          // Repo-relative on purpose: a Windows temp path containing a space
          // makes PHP abort its ini parsing and ignore later -d options.
          "-d", `error_log=${path.join(WORK, "php-error.log").split(path.sep).join("/")}`,
          "-S", `127.0.0.1:${API_PORT}`,
          "-t", "public",
        ],
        apiEnv()
      );
      state.api = started;
      console.log(`php         started  pid ${started.pid}  (log ${path.relative(ROOT, started.log)})`);
    }
  } else {
    console.log(`php         already listening on ${API_PORT}`);
  }

  state.mode = MODE;
  writeState(state);

  if (!(await waitForHttp(`http://127.0.0.1:${INBOX_PORT}/api/v1/messages`))) {
    console.error(`\nMailpit did not answer on http://127.0.0.1:${INBOX_PORT}. See ${path.relative(ROOT, path.join(WORK, "mailpit.log"))}.`);
    process.exitCode = 1;
  }
  if (!(await waitForHttp(`http://127.0.0.1:${API_PORT}/api/health.php`))) {
    console.error(`\nPHP did not answer on http://127.0.0.1:${API_PORT}. See ${path.relative(ROOT, path.join(WORK, "api.log"))}.`);
    process.exitCode = 1;
  }

  const authLine =
    authAdvertised === true
      ? "auth required (the stack's own synthetic credentials), loopback, no relay"
      : "no auth needed, loopback, no relay";

  console.log(`\n  mode            ${MODE}${NEEDS_AUTH ? "  (review flow, routed to a reserved test inbox)" : "  (capture; cannot reach a person)"}
  capture inbox   http://127.0.0.1:${INBOX_PORT}
  smtp capture    smtp://127.0.0.1:${SMTP_PORT}   (${authLine})
  endpoint        http://127.0.0.1:${API_PORT}/api/submit.php

  Point the form at the endpoint:
      $env:NEXT_PUBLIC_FORMS_ENDPOINT="http://127.0.0.1:${API_PORT}/api/submit.php"

  Then, in another shell:
      npm run dev

  Check which state the endpoint is in:
      http://127.0.0.1:${API_PORT}/api/health.php?token=local-demo
${NEEDS_AUTH ? `
  Send the sample through the real endpoint:
      npm run sample:send
` : ""}
  Stop everything with:  npm run mail:stop
`);
}

function status() {
  const state = readState();
  const rows = [
    ["mailpit", state.mailpit, INBOX_PORT],
    ["php", state.api, API_PORT],
  ];
  for (const [name, entry, port] of rows) {
    const running = entry ? (alive(entry.pid) ? "running" : "stopped") : "not started by this tool";
    console.log(`${name.padEnd(8)} ${String(entry?.pid ?? "-").padEnd(8)} port ${String(port).padEnd(6)} ${running}`);
  }
  console.log(`\nmode     ${state.mode || "(not recorded — start it with npm run mail:start)"}`);
  if (state.captureAuth !== undefined && state.captureAuth !== null) {
    console.log(`capture  ${state.captureAuth ? "requires SMTP AUTH (sample mode)" : "accepts unauthenticated mail (local mode)"}`);
  }
  console.log(`state file: ${path.relative(ROOT, STATE)}`);
}

function stop() {
  const state = readState();
  for (const name of ["api", "mailpit"]) {
    if (state[name]?.pid && alive(state[name].pid)) {
      kill(state[name].pid);
      console.log(`${name.padEnd(8)} stopped (pid ${state[name].pid})`);
      // The password file is only ever read at Mailpit's startup, and it is
      // regenerated on the next start, so remove it with the process it served.
      if (name === "mailpit") {
        try {
          fs.rmSync(AUTH_FILE, { force: true });
        } catch {}
      }
    } else {
      console.log(`${name.padEnd(8)} was not running`);
    }
    state[name] = null;
  }
  state.mode = null;
  state.captureAuth = null;
  writeState(state);
}

if (command === "start") await start();
else if (command === "stop") stop();
else if (command === "status") status();
else {
  console.error(`Unknown command "${command}". Use start, stop or status.`);
  process.exitCode = 1;
}
