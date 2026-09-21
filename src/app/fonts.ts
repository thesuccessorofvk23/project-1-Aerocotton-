import { Fraunces, Poppins } from "next/font/google";

/**
 * Fraunces — display serif. Its SOFT axis literally encodes softness,
 * which suits a cotton brand. Variable font, self-hosted by next/font.
 */
export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

/** Poppins — body / interface sans. Geometric, clear, readable. */
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
