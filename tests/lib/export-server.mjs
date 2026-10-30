/**
 * Serve `out/` the way a static host does — the project's own
 * scripts/serve-export.mjs, on a port the OS picks, so the suite never fights
 * another process for 4181.
 */
import { spawn } from "node:child_process";
import { ROOT } from "./harness.mjs";
import { stopTree } from "../../scripts/lib/stop-tree.mjs";

export async function serveExport() {
  const child = spawn(
    process.execPath,
    ["scripts/serve-export.mjs", "--port", "0", "--dir", "out"],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] }
  );

  const url = await new Promise((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(
      () => reject(new Error(`export server did not report a port:\n${buffer}`)),
      10000
    );
    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const match = buffer.match(/http:\/\/localhost:(\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(`http://127.0.0.1:${match[1]}`);
      }
    });
    child.on("error", reject);
  });

  return {
    url,
    stop() {
      // The server runs PHP as its own child; stop the tree so the suite cannot
      // leave a php.exe holding a port behind.
      stopTree(child);
    },
  };
}
