# Aerocotton preview run doc

Static marketing/e-commerce site — Next.js 16 (App Router, Turbopack), React 19, Tailwind 4. No database, no auth.

## Reproduce artifacts (fresh checkout)

1. Install dependencies (npm project — `package-lock.json` present):

   ```
   npm ci
   ```

2. No `.env.local` is required to run the dev server. (`.env.example` exists for the Resend email route; copy it from the main checkout and fill in secrets only if exercising `/api` email endpoints.)

## Run the server

- Default port is 3000, but other threads may occupy it. Check with `netstat -ano | grep :3000`; if busy, use 3100 (also verify free the same way).
- Start detached from the repo root (PowerShell; stdout and stderr must go to different files):

  ```
  powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','-p','3100' -WorkingDirectory 'E:\Aerocotton' -RedirectStandardOutput 'E:\Aerocotton\.freebuff\preview.log' -RedirectStandardError 'E:\Aerocotton\.freebuff\preview.log.err' -WindowStyle Hidden -PassThru).Id"
  ```

- Note: the `Start-Process` launcher itself may report a timeout on this machine; the process still starts. Verify with `Get-Process -Id <pid>` and `curl http://localhost:3100/` (expect HTTP 200 and `✓ Ready` in the log).
- Register the preview with the printed pid and `http://localhost:3100`.
