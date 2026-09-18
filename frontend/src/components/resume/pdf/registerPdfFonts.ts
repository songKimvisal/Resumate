import { Font } from "@react-pdf/renderer";
import { BUNDLED_FONTS } from "../../../lib/fonts";

import interRegular from "../../../assets/fonts/Inter-Regular.ttf?url";
import interBold from "../../../assets/fonts/Inter-Bold.ttf?url";
import interItalic from "../../../assets/fonts/Inter-Italic.ttf?url";
import robotoRegular from "../../../assets/fonts/Roboto-Regular.ttf?url";
import robotoBold from "../../../assets/fonts/Roboto-Bold.ttf?url";
import robotoItalic from "../../../assets/fonts/Roboto-Italic.ttf?url";
import poppinsRegular from "../../../assets/fonts/Poppins-Regular.ttf?url";
import poppinsBold from "../../../assets/fonts/Poppins-Bold.ttf?url";
import poppinsItalic from "../../../assets/fonts/Poppins-Italic.ttf?url";
import latoRegular from "../../../assets/fonts/Lato-Regular.ttf?url";
import latoBold from "../../../assets/fonts/Lato-Bold.ttf?url";
import latoItalic from "../../../assets/fonts/Lato-Italic.ttf?url";
import merriweatherRegular from "../../../assets/fonts/Merriweather-Regular.ttf?url";
import merriweatherBold from "../../../assets/fonts/Merriweather-Bold.ttf?url";
import merriweatherItalic from "../../../assets/fonts/Merriweather-Italic.ttf?url";
import kantumruyRegular from "../../../assets/fonts/KantumruyPro-Regular.ttf?url";
import kantumruyBold from "../../../assets/fonts/KantumruyPro-Bold.ttf?url";
import battambangRegular from "../../../assets/fonts/Battambang-Regular.ttf?url";
import battambangBold from "../../../assets/fonts/Battambang-Bold.ttf?url";
import hanumanRegular from "../../../assets/fonts/Hanuman-Regular.ttf?url";
import hanumanBold from "../../../assets/fonts/Hanuman-Bold.ttf?url";
import nokoraRegular from "../../../assets/fonts/Nokora-Regular.ttf?url";
import nokoraBold from "../../../assets/fonts/Nokora-Bold.ttf?url";

let registered = false;

/** Each face gets its own family name rather than weights on one family.
 *  react-pdf resolves `fontFamily` by exact name, and asking a single family
 *  for a weight it was not given silently falls back to the regular face -
 *  which is how bold text ended up looking regular. `pdfFontVariants` returns
 *  these exact names. */
const FACES: Record<
  (typeof BUNDLED_FONTS)[number],
  { regular: string; bold: string; italic?: string }
> = {
  Inter: { regular: interRegular, bold: interBold, italic: interItalic },
  Roboto: { regular: robotoRegular, bold: robotoBold, italic: robotoItalic },
  Poppins: { regular: poppinsRegular, bold: poppinsBold, italic: poppinsItalic },
  Lato: { regular: latoRegular, bold: latoBold, italic: latoItalic },
  Merriweather: {
    regular: merriweatherRegular,
    bold: merriweatherBold,
    italic: merriweatherItalic,
  },
  // Khmer ships regular + bold only; italic falls back to regular
  "Kantumruy Pro": { regular: kantumruyRegular, bold: kantumruyBold },
  Battambang: { regular: battambangRegular, bold: battambangBold },
  Hanuman: { regular: hanumanRegular, bold: hanumanBold },
  Nokora: { regular: nokoraRegular, bold: nokoraBold },
};

/** Embeds the same TTFs the preview renders with, so a downloaded PDF uses the
 *  typeface the user actually picked instead of Helvetica/Times. */
export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  for (const [family, faces] of Object.entries(FACES)) {
    Font.register({ family, src: faces.regular });
    Font.register({ family: `${family}-Bold`, src: faces.bold });
    if (faces.italic) {
      Font.register({ family: `${family}-Italic`, src: faces.italic });
    }
  }

  // Khmer has no hyphenation points; splitting glyphs breaks words.
  Font.registerHyphenationCallback((word) => [word]);
}
