@echo off
rem Double-click this to view the built site. It serves out/ over HTTP and opens
rem the browser. Opening out\index.html from disk cannot work: the export's asset
rem paths are absolute, so a browser loads them from the root of the drive and the
rem page arrives unstyled with no images, video or JavaScript.
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js was not found on PATH, so the site cannot be served over HTTP.
  echo Install Node.js, or upload the contents of "out" to your web host and
  echo open the live site there.
  echo.
  pause
  exit /b 1
)

rem %* is passed through, so "View Site.cmd --no-open" serves without opening a
rem browser (used by the deploy check); a plain double-click opens it.
node "scripts\open-site.mjs" %*
if errorlevel 1 (
  echo.
  pause
)
endlocal
