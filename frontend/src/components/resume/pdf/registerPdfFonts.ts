import { Font } from "@react-pdf/renderer";
import kantumruyRegularUrl from "../../../assets/fonts/KantumruyPro-Regular.ttf?url";
import kantumruyBoldUrl from "../../../assets/fonts/KantumruyPro-Bold.ttf?url";

let registered = false;

/** Embed static Kantumruy Pro Regular + Bold so Khmer PDF text can actually bold.
 *  Helvetica/Times cannot draw Khmer glyphs. A variable TTF registered twice
 *  does not give react-pdf a real 700 weight. */
export function registerPdfFonts() {
  if (registered) return;
  registered = true;
  Font.register({
    family: "Kantumruy Pro",
    fonts: [
      { src: kantumruyRegularUrl, fontWeight: 400 },
      { src: kantumruyRegularUrl, fontWeight: "normal" },
      { src: kantumruyBoldUrl, fontWeight: 600 },
      { src: kantumruyBoldUrl, fontWeight: 700 },
      { src: kantumruyBoldUrl, fontWeight: "bold" },
    ],
  });
  Font.register({
    family: "Kantumruy Pro-Bold",
    src: kantumruyBoldUrl,
  });
  // Khmer has no hyphenation points; splitting glyphs breaks words.
  Font.registerHyphenationCallback((word) => [word]);
}
