import { JetBrains_Mono, Poppins } from "next/font/google";

// Google serves Poppins without a Vietnamese subset; the fallback list draws
// those letters instead of the size-adjusted Arial next/font would add.
const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--sp-font-sans",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Avenir Next", "Avenir", "Segoe UI", "sans-serif"],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--sp-font-mono",
  display: "swap",
});

/** Class names exposing the app fonts; applied beside `sp-theme` or `sp-font`. */
export const speakingFontClasses = `${poppins.variable} ${jetBrainsMono.variable}`;
