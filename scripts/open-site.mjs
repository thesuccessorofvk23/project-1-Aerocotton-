#!/usr/bin/env node
/**
 * Serves the built site over HTTP and opens it in the browser — the safe way to
 * look at a production build.
 *
 *   npm run open            (or double-click "View Site.cmd")
 *   node scripts/open-site.mjs [--port 4181] [--dir out] [--no-open]
 *
 * Why this exists: `out/` is a static export written with root-relative URLs
 * (`/_next/...`, `/images/...`), which is exactly what a web host expects. A
 * browser opening `out/index.html` **from disk** resolves those against the
 * filesystem root, so the page arrives as raw HTML — no stylesheet, no fonts,
 * no images, no video, no JavaScript, no animation. Served over HTTP the same
 * folder is the real site.
 *
 * The port is taken from the child's own report of what it bound, never
 * assumed: `--port 0` lets the OS choose, and a preferred port that is already
 * taken falls back to that. The address printed here is therefore the one that
 * is answering, and nothing else's server can be mistaken for ours.
 *
 * The server runs as a child of this process: Ctrl+C here (or closing the
 * window) stops it. Nothing outside the export is served.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stopTree } from "./lib/stop-tree.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const preferred = Number(flag("port", 4181));
const dir = flag("dir", "out");
const shouldOpen = !args.includes("--no-open");

const serverScript = fileURLToPath(new URL("./serve-export.mjs", import.meta.url));

if (!fs.existsSync(path.resolve(dir, "index.html"))) {
  console.error(`${path.resolve(dir, "index.html")} is missing — run "npm run build" first.`);
  process.exit(1);
}

/** Start the export server and resolve the address it says it bound to, or null. */
const start = (port) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [serverScript, "--port", String(port), "--dir", dir], {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: path.resolve(path.dirname(serverScript), ".."),
    });
    let output = "";
    let settled = false;
    const finish = (address) => {
      if (settled) return;
      settled = true;
      resolve({ child, address, output: () => output });
    };
    const onData = (chunk) => {
      output += String(chunk);
      const match = output.match(/http:\/\/localhost:(\d+)/);
      if (match) finish(`http://localhost:${match[1]}/`);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => finish(code === 0 ? "exited" : null));
    setTimeout(() => finish(null), 8000);
  });

let running = await start(preferred > 0 ? preferred : 0);
if (!running.address) {
  // Preferred port busy (or nothing reported): let the OS pick one instead.
  running = await start(0);
}
if (!running.address || running.address === "exited") {
  console.error(`could not start the export server:\n${running.output().trim()}`);
  process.exit(1);
}

const { child, address } = running;

/** Poll until the server actually answers, rather than assuming it came up. */
const ready = async () => {
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) return false;
    try {
      const res = await fetch(address, { redirect: "manual" });
      if (res.status === 200) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
};

if (!(await ready())) {
  child.kill();
  console.error(`the export server never answered on ${address}`);
  process.exit(1);
}

console.log(`\n  Aero Cotton — built site\n  ${address}\n`);
console.log("  This is the folder that gets uploaded to BigRock (its contents go");
console.log("  into the document root). Opening out/index.html straight from disk");
console.log("  cannot work: the export's asset paths are absolute, so the browser");
console.log("  looks for them at the root of the drive and the page arrives with");
console.log("  no stylesheet, images, video or JavaScript.\n");
console.log("  Ctrl+C to stop.\n");

if (shouldOpen) {
  const opener =
    process.platform === "win32"
      ? { command: "cmd", args: ["/c", "start", "", address] }
      : process.platform === "darwin"
        ? { command: "open", args: [address] }
        : { command: "xdg-open", args: [address] };
  try {
    spawn(opener.command, opener.args, { stdio: "ignore", detached: true }).unref();
  } catch (error) {
    console.log(`  (could not open a browser automatically: ${error.message})`);
  }
}

const stop = () => {
  // Closing the window must not leave the preview's PHP process behind.
  stopTree(child);
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", () => process.exit(0));
