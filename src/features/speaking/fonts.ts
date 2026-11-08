import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--sp-font-sans",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--sp-font-mono",
  display: "swap",
});

/** Class names exposing the app fonts; applied beside `sp-theme` or `sp-font`. */
export const speakingFontClasses = `${beVietnamPro.variable} ${jetBrainsMono.variable}`;
