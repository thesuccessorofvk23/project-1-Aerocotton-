import { spawnSync } from "node:child_process";

/**
 * Stop a child process and anything it started.
 *
 * The preview server runs PHP as a child of its own. On Windows a plain
 * `child.kill()` is `TerminateProcess`: the Node process disappears without its
 * `exit` handlers running, so the PHP child is orphaned and keeps its port.
 * `taskkill /T` takes the tree. On POSIX the signal reaches the child's handler,
 * which shuts PHP down itself.
 */
export function stopTree(child) {
  if (!child || child.exitCode !== null || child.pid === undefined) return;

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }

  child.kill("SIGTERM");
}
