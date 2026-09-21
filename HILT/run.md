# Aero Cotton — Run Doc

Static multi-page Next.js 16 site (Turbopack dev). No database, no required env file.

## Reproduce artifacts

1. **Install dependencies:** `npm install` (lockfile `package-lock.json` is committed).
2. **Environment:** nothing is required for the dev server. `RESEND_API_KEY` is optional —
   without it the RFQ server action simulates delivery (see `src/lib/rfq/send.ts`).
   For real email delivery, copy `.env.example` → `.env.local` and fill in values
   (procedure only — never commit secret values).
3. **No build step is needed for preview.** `npm run build` produces the production bundle
   in `.next/` if you want to run `npm run start` instead.

## Run the server

- Command: `npm run dev`
- Next.js auto-selects the port: **3000 if free, otherwise a random high port.**
  Read the `Local:` line from the server log for the actual URL.
- Current running instance: **http://localhost:55636** (pid 19832), started detached via
  PowerShell `Start-Process npm.cmd run dev` with stdout/stderr redirected to
  `.freebuff/preview-95f57c08-*.log` and `.log.err` (must be two different files).
- Note: the `Start-Process -PassThru` launcher may not print the pid before a short
  tool timeout expires — the server still starts. Verify via the log's `✓ Ready` line
  and `netstat -ano | grep ":<port>" | grep LISTENING` instead of retrying.
- Stop: `taskkill //PID <pid> //F`
