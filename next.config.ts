import type { NextConfig } from "next";

/**
 * The export is written with root-relative URLs (`/_next/...`, `/images/...`),
 * which is what a static host expects when the site sits at the document root
 * — `httpdocs/` on BigRock. Those paths are already correct for HTTP: no
 * rewrite is needed, and [public/web.config](public/web.config) /
 * [public/.htaccess](public/.htaccess) only supply the default document, a real
 * 404 and the MIME types the export uses.
 *
 * That also means the site has to be served from the root of a domain or
 * subdomain. A URL subpath (`https://example.com/aerocotton/`) does not work:
 * `basePath` would rewrite Next's own `/_next/...` URLs, but not the plain
 * `<img src="/images/...">` and CSS `url(/images/...)` references the
 * components use, so every photograph, brand mark and the hero video would
 * 404. Verified by building with `basePath: '/aerocotton'` and serving it: the
 * pages, fonts, CSS and JS loaded under the prefix while all media 404'd.
 * Point a domain (or subdomain) at the folder instead.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },

  /**
   * `out/` is the site that is already live in httpdocs, so a build must not be
   * able to overwrite it by accident. `output: "export"` writes the export to
   * that directory, and `distDir` is the documented way to redirect it — see
   * node_modules/next/dist/docs/01-app/02-guides/static-exports.md.
   *
   * Set NEXT_DIST_DIR to build into a throwaway directory instead:
   *
   *     NEXT_DIST_DIR=out-verify npx next build
   *
   * The key is only added when the variable is present, so the default build is
   * byte-for-byte the behaviour it always had: an export in `out/`.
   */
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
