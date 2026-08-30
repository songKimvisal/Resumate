import { Font } from "@react-pdf/renderer";
import kantumruyUrl from "../../../assets/fonts/KantumruyPro.ttf?url";

let registered = false;

/** Embed Kantumruy Pro so Khmer headings and body text render in PDFs.
 *  Helvetica/Times cannot draw Khmer glyphs. */
export function registerPdfFonts() {
  if (registered) return;
  registered = true;
  Font.register({ family: "Kantumruy Pro", src: kantumruyUrl });
  Font.register({ family: "Kantumruy Pro-Bold", src: kantumruyUrl });
  // Khmer has no hyphenation points; splitting glyphs breaks words.
  Font.registerHyphenationCallback((word) => [word]);
}
