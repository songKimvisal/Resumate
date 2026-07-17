export const FONT_FAMILIES = [
  "Inter",
  "Roboto",
  "Poppins",
  "Lato",
  "Merriweather",
  "Georgia",
] as const;

const SERIF_FONTS = new Set(["Merriweather", "Georgia"]);

/** CSS font-family stack for the live (HTML) preview. */
export function cssFontStack(family: string) {
  return SERIF_FONTS.has(family)
    ? `"${family}", Georgia, serif`
    : `"${family}", ui-sans-serif, sans-serif`;
}

export type PdfFontFamily = "Helvetica" | "Times-Roman";

export function pdfFontFamily(family: string): PdfFontFamily {
  return SERIF_FONTS.has(family) ? "Times-Roman" : "Helvetica";
}

/** Regular/bold/italic PDF font names for a given base family. */
export function pdfFontVariants(family: PdfFontFamily) {
  return family === "Times-Roman"
    ? { regular: "Times-Roman", bold: "Times-Bold", italic: "Times-Italic" }
    : {
        regular: "Helvetica",
        bold: "Helvetica-Bold",
        italic: "Helvetica-Oblique",
      };
}
