
export const LATIN_FONTS = [
  "Inter",
  "Roboto",
  "Poppins",
  "Lato",
  "Merriweather",
  "Georgia",
] as const;

export const KHMER_FONTS = [
  "Kantumruy Pro",
  "Battambang",
  "Hanuman",
  "Nokora",
] as const;

export const FONT_FAMILIES = [...LATIN_FONTS, ...KHMER_FONTS] as const;

export type LatinFont = (typeof LATIN_FONTS)[number];
export type KhmerFont = (typeof KHMER_FONTS)[number];

const SERIF_FONTS = new Set(["Merriweather", "Georgia"]);

const KHMER_SET = new Set<string>(KHMER_FONTS);

/** The pick used whenever Khmer has to be drawn and the chosen family can't. */
export const DEFAULT_KHMER_FONT: KhmerFont = "Kantumruy Pro";
export const DEFAULT_LATIN_FONT: LatinFont = "Inter";

export function isKhmerFont(family: string): family is KhmerFont {
  return KHMER_SET.has(family);
}

/** The family to use for a resume in `lang`, keeping the current pick when it
 *  already suits that script. */
export function fontForLanguage(family: string, lang: "en" | "km") {
  if (lang === "km") return isKhmerFont(family) ? family : DEFAULT_KHMER_FONT;
  return isKhmerFont(family) ? DEFAULT_LATIN_FONT : family;
}

/** The families the picker offers for a resume written in `lang`. */
export function fontsForLanguage(lang?: "en" | "km" | null) {
  return lang === "km" ? KHMER_FONTS : LATIN_FONTS;
}
export const BUNDLED_FONTS = [
  "Inter",
  "Roboto",
  "Poppins",
  "Lato",
  "Merriweather",
  "Kantumruy Pro",
  "Battambang",
  "Hanuman",
  "Nokora",
] as const;

export type BundledFont = (typeof BUNDLED_FONTS)[number];

function isBundled(family: string): family is BundledFont {
  return (BUNDLED_FONTS as readonly string[]).includes(family);
}

export function cssFontStack(family: string) {
  if (isKhmerFont(family)) {
    // the Latin face behind it supplies the punctuation Khmer faces lack
    return SERIF_FONTS.has(family)
      ? `"${family}", "Merriweather", Georgia, serif`
      : `"${family}", "Inter", ui-sans-serif, sans-serif`;
  }
  return SERIF_FONTS.has(family)
    ? `"${family}", Georgia, "Times New Roman", serif`
    : `"${family}", "Inter", ui-sans-serif, sans-serif`;
}

export type PdfFontFamily = BundledFont | "Helvetica" | "Times-Roman";

export function pdfFontFamily(
  family: string,
  headingLanguage?: "en" | "km",
  hasKhmer?: boolean,
): PdfFontFamily {

  if (headingLanguage === "km" || hasKhmer) {
    return isKhmerFont(family) ? family : DEFAULT_KHMER_FONT;
  }
  if (isBundled(family)) return family;
  return SERIF_FONTS.has(family) ? "Times-Roman" : "Helvetica";
}

export function pdfFontVariants(family: PdfFontFamily) {
  if (family === "Helvetica") {
    return {
      regular: "Helvetica",
      bold: "Helvetica-Bold",
      italic: "Helvetica-Oblique",
    };
  }
  if (family === "Times-Roman") {
    return { regular: "Times-Roman", bold: "Times-Bold", italic: "Times-Italic" };
  }
  if (isKhmerFont(family)) {
    return {
      regular: [family, "Inter"],
      bold: [`${family}-Bold`, "Inter-Bold"],
      italic: [family, "Inter"],
    };
  }
  return {
    regular: family,
    bold: `${family}-Bold`,
    italic: `${family}-Italic`,
  };
}
