#!/usr/bin/env node
/**
 * Serves the static export in `out/` the way a static host would, so the built
 * site can be checked before it is pushed — a different thing from `next dev`,
 * because the export is plain files with no server runtime.
 *
 *   node scripts/serve-export.mjs [--port 4181] [--dir out] [--no-php]
 *
 * Resolves a directory to its `index.html` (the export uses `trailingSlash`),
 * and falls back to `404.html` for anything missing.
 *
 * The live host is IIS with PHP, so the forms only work when `/api/*.php` is
 * executed rather than downloaded. This server therefore runs the same PHP
 * files through PHP's built-in server and proxies `/api/*.php` to it. Without
 * that, `POST /api/submit.php` answered 200 `application/octet-stream` with the
 * endpoint's own source, `JSON.parse` failed, and the visitor was told "The
 * enquiry service is not responding from this address" — an error that
 * described this preview, not the code. PHP source is never served as a file
 * here, in any state.
 *
 * Runtime state (rate-limit counters, logs) is pointed outside the export, so
 * exercising the form cannot add files to the tree that gets uploaded.
 */
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORK = path.join(ROOT, ".pdf-work");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const port = Number(flag("port", 4181));
const root = path.resolve(flag("dir", "out"));
const usePhp = !args.includes("--no-php");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".obj": "text/plain; charset=utf-8",
  ".glb": "model/gltf-binary",
};

/** JSON, always — so the client's JSON.parse never fails on this server. */
const sendJson = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
};

const resolveFile = (urlPath) => {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const target = path.join(root, clean);
  if (!target.startsWith(root)) return null; // no climbing out of the export
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    const index = path.join(target, "index.html");
    return fs.existsSync(index) ? index : null;
  }
  return fs.existsSync(target) ? target : null;
};

/* ── PHP for /api/*.php ─────────────────────────────────────────────────── */

/** Same lookup order as the mail stack: AERO_PHP, the bundled tool, then PATH. */
function findPhp() {
  if (process.env.AERO_PHP) return process.env.AERO_PHP;
  const bundled = path.join(WORK, "tools", "php", "php.exe");
  if (fs.existsSync(bundled)) return bundled;
  const probe = spawnSync("php", ["-v"], { stdio: "ignore" });
  return probe.error ? null : "php";
}

const php = usePhp ? findPhp() : null;
let phpChild = null;
let phpPort = 0;
let phpReady = false;

// The host exposes exactly two PHP entry points; every other .php file in the
// folder is private (web.config denies it). The preview does the same rather
// than executing, or worse downloading, configuration and libraries.
const PUBLIC_ENDPOINTS = new Set(["/api/submit.php", "/api/health.php"]);
const publicEndpoint = (urlPath) => {
  const clean = (urlPath.split("?")[0] || "").toLowerCase();
  return PUBLIC_ENDPOINTS.has(clean) ? clean : null;
};

/** One TCP attempt: does anything accept a connection on `candidate` yet? */
const acceptsConnection = (candidate) =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(400);
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
    socket.connect(candidate, "127.0.0.1");
  });

/** Keep trying for a few seconds: PHP needs a moment before it binds. */
async function waitForListen(candidate, tries) {
  for (let i = 0; i < tries; i++) {
    if (await acceptsConnection(candidate)) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

/**
 * Start PHP against the export. The port is chosen here so the proxy has a
 * fixed target; a busy port makes PHP exit, and that is retried rather than
 * reported as a successful start.
 */
async function startPhp(previewPort) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const candidate = 9000 + Math.floor(Math.random() * 900);
    // PHP's own output goes to a file: a piped-but-unread stream fills up and
    // stalls the server, and a failed start leaves nothing to read afterwards.
    const logFd = fs.openSync(path.join(WORK, "preview-php.log"), "a");
    const child = spawn(
      php,
      [
        "-d", "display_errors=0",
        "-d", "log_errors=1",
        // Repo-relative: a temp path containing a space breaks PHP's ini parsing.
        "-d", `error_log=${path.join(WORK, "preview-php-error.log").split(path.sep).join("/")}`,
        "-S", `127.0.0.1:${candidate}`,
        "-t", root,
      ],
      {
        cwd: ROOT,
        env: {
          ...process.env,
          // Keep counters and logs out of the export: nothing here may add a
          // file to the tree that gets uploaded.
          AERO_DATA_DIR: path.join(WORK, "preview-runtime", "data").split(path.sep).join("/"),
          AERO_LOG_FILE: path.join(WORK, "preview-runtime", "submissions.log").split(path.sep).join("/"),
          // The endpoint checks the Origin header. The default allowlist knows
          // 4181, so a fallback port would otherwise reject the preview's own
          // pages as a foreign origin — a correct refusal that reads like a bug.
          AERO_ALLOWED_ORIGINS: [
            process.env.AERO_ALLOWED_ORIGINS,
            `http://127.0.0.1:${previewPort}`,
            `http://localhost:${previewPort}`,
          ]
            .filter(Boolean)
            .join(","),
        },
        stdio: ["ignore", logFd, logFd],
      }
    );
    fs.closeSync(logFd);

    child.on("error", () => {});

    if (await waitForListen(candidate, 40)) {
      phpChild = child;
      phpPort = candidate;
      phpReady = true;
      child.on("exit", () => {
        phpReady = false;
      });
      return true;
    }

    child.kill();
  }
  return false;
}

/** Forward one request to PHP, preserving method, headers, status and body. */
function proxyToPhp(req, res) {
  if (!phpReady) {
    return sendJson(res, 503, {
      ok: false,
      message: "The preview's PHP process is not answering. Stop and restart the preview.",
    });
  }

  const headers = { ...req.headers, host: `127.0.0.1:${phpPort}` };
  delete headers.connection;

  const upstream = http.request(
    { host: "127.0.0.1", port: phpPort, method: req.method, path: req.url, headers },
    (reply) => {
      res.writeHead(reply.statusCode ?? 502, reply.headers);
      reply.pipe(res);
    }
  );

  upstream.on("error", () => {
    if (res.headersSent) return res.destroy();
    sendJson(res, 502, {
      ok: false,
      message: "The preview's PHP process did not answer. Stop and restart the preview.",
    });
  });

  req.pipe(upstream);
}

/* ── Server ─────────────────────────────────────────────────────────────── */

const stopPhp = () => {
  if (phpChild && phpChild.exitCode === null) phpChild.kill();
  phpChild = null;
  phpReady = false;
};
process.on("exit", stopPhp);
process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

// Started once the preview knows which port it bound (the origin allowlist
// needs it), and awaited by the first API request: a request that arrives while
// PHP is still coming up waits a moment instead of being told it is broken.
let phpStartup = null;

http
  .createServer(async (req, res) => {
    const urlPath = req.url ?? "/";

    try {
      if (publicEndpoint(urlPath)) {
        if (php) {
          if (phpStartup) await phpStartup;
          return proxyToPhp(req, res);
        }
        // No PHP: say so in JSON. Anything else here (raw source, an IIS-style
        // HTML error page) is read by the form as "the service is not responding".
        return sendJson(res, 503, {
          ok: false,
          message:
            "This preview serves the built site as static files and PHP is not available, " +
            "so the enquiry endpoint cannot run here. Start the local stack with " +
            '"npm run mail:start" and use "npm run dev", or set AERO_PHP to a PHP 8 binary.',
        });
      }

      // Nothing else under /api/ is public, and never as a file.
      if (/^\/api\//i.test(urlPath)) {
        return sendJson(res, 404, { ok: false, message: "Not Found" });
      }

      const file = resolveFile(urlPath);
      const send = (p, status) => {
        res.writeHead(status, { "content-type": TYPES[path.extname(p)] ?? "application/octet-stream" });
        fs.createReadStream(p).pipe(res);
      };
      if (file) return send(file, 200);
      const fallback = path.join(root, "404.html");
      if (fs.existsSync(fallback)) return send(fallback, 404);
      res.writeHead(404).end("not found");
    } catch {
      if (!res.headersSent) sendJson(res, 500, { ok: false, message: "Preview server error." });
      else res.destroy();
    }
  })
  // `--port 0` asks the OS for a free port; report the one it actually bound to
  // rather than the one that was requested, so the caller can trust the address.
  .listen(port, function () {
    const bound = this.address().port;
    console.log(`serving ${root} on http://localhost:${bound}`);
    console.log(
      php
        ? "php         /api/*.php is executed by PHP (origin http://127.0.0.1:" + bound + ")"
        : "php         not found: /api/*.php answers 503 (run npm run mail:start for a working form)"
    );

    if (php) {
      phpStartup = startPhp(bound);
      phpStartup.then((ok) => {
        if (!ok) console.log("php         could not start: /api/*.php answers 503, never source");
      });
    }
  });
