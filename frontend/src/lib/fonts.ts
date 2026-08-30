export const FONT_FAMILIES = [
  "Inter",
  "Roboto",
  "Poppins",
  "Lato",
  "Merriweather",
  "Georgia",
  "Kantumruy Pro",
] as const;

const SERIF_FONTS = new Set(["Merriweather", "Georgia"]);

/** CSS font-family stack for the live (HTML) preview. Kantumruy Pro covers Khmer glyphs. */
export function cssFontStack(family: string) {
  if (family === "Kantumruy Pro") {
    return `"Kantumruy Pro", "Inter", ui-sans-serif, sans-serif`;
  }
  return SERIF_FONTS.has(family)
    ? `"${family}", "Kantumruy Pro", Georgia, serif`
    : `"${family}", "Kantumruy Pro", ui-sans-serif, sans-serif`;
}

export type PdfFontFamily = "Helvetica" | "Times-Roman" | "Kantumruy Pro";

export function pdfFontFamily(
  family: string,
  headingLanguage?: "en" | "km",
  hasKhmer?: boolean,
): PdfFontFamily {
  if (headingLanguage === "km" || hasKhmer || family === "Kantumruy Pro") {
    return "Kantumruy Pro";
  }
  return SERIF_FONTS.has(family) ? "Times-Roman" : "Helvetica";
}

/** Regular/bold/italic PDF font names for a given base family. */
export function pdfFontVariants(family: PdfFontFamily) {
  if (family === "Kantumruy Pro") {
    return {
      regular: "Kantumruy Pro",
      bold: "Kantumruy Pro-Bold",
      italic: "Kantumruy Pro",
    };
  }
  return family === "Times-Roman"
    ? { regular: "Times-Roman", bold: "Times-Bold", italic: "Times-Italic" }
    : {
        regular: "Helvetica",
        bold: "Helvetica-Bold",
        italic: "Helvetica-Oblique",
      };
}
