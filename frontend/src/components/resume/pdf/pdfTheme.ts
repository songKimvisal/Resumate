import { cloneElement, isValidElement, type ReactNode } from "react";
import type {
  Customization,
  Resume,
  SpecialSectionKey,
} from "../../../types/resume";
import { partitionSpecialSectionOrder } from "../../../lib/sectionOrder";
import { pdfFontFamily, pdfFontVariants } from "../../../lib/fonts";
import { contrastOn } from "../../../lib/color";
import { headingLang, resumeNeedsKhmerFont } from "../../../lib/resumeHeadings";
import {
  ATS,
  dateRange,
  gpaText,
  hasText,
  languageLabel,
  normalizeJobs,
  personalContactLines,
  type ContactLineItem,
  type JobLike,
} from "../layouts/shared";

export {
  ATS,
  dateRange,
  gpaText,
  hasText,
  languageLabel,
  normalizeJobs,
  personalContactLines,
};
export type { ContactLineItem, JobLike };

/** px (96/inch) -> pt (72/inch), so borders/photos match the preview. */
export const PX_TO_PT = 72 / 96;

/** A Tailwind spacing step (`gap-3`, `space-y-4`, `mt-1.5`, `px-8` ...) in pt.
 *  Tailwind's scale is 4px per step, so `gap-3` is 12px, not 3px - pass the
 *  number from the class name and this does both conversions. Use `PX_TO_PT`
 *  directly only for values the preview states in real pixels, like
 *  `h-[2px]`, `border-l-2`, or `customization.photoSize`. */
export function sp(step: number) {
  return step * 4 * PX_TO_PT;
}

/** Type converts on exactly the same scale as everything else.
 *
 *  The preview draws A4 at 96dpi (794px wide, RESUME_PREVIEW_NATIVE_WIDTH);
 *  the PDF page is 595.28pt. That is a 0.7497 scale - i.e. `PX_TO_PT`. Any
 *  other ratio for font size makes the text a different fraction of the page
 *  than the preview shows, so lines wrap in different places and the two stop
 *  matching no matter how carefully the spacing is tuned. */
export const FONT_SIZE_RATIO = PX_TO_PT;

/** Resolved, customization-driven values every special PDF layout needs.
 *  Mirrors what `layoutPageStyle` + each layout's local consts give the
 *  preview, so a layout body can be a near line-for-line translation. */
export type PdfTheme = ReturnType<typeof pdfTheme>;

export function pdfTheme(resume: Resume) {
  const c = resume.customization;
  const font = pdfFontFamily(
    c.fontFamily,
    c.headingLanguage,
    resumeNeedsKhmerFont(resume),
  );
  const variants = pdfFontVariants(font);
  /** body size in pt - every `em`-relative size in the preview is expressed
   *  against this, the same way the DOM layouts scale off `fontSize` */
  const base = c.fontSize * FONT_SIZE_RATIO;
  const km = headingLang(c) === "km";
  return {
    c,
    resume,
    font,
    variants,
    base,
    /** `em` helper: `t.em(0.9)` is the pt size of `text-[0.9em]` */
    em: (factor: number) => base * factor,
    lineHeight: km
      ? Math.max(c.lineHeight || 1.45, 1.6)
      : c.lineHeight || 1.45,
    gap: c.elementSpacing * PX_TO_PT,
    ink: c.bodyTextColor || ATS.ink,
    muted: ATS.muted,
    line: ATS.line,
    accent: c.accentColor || ATS.navy,
    sidebar: c.sidebarBgColor || ATS.navy,
    onDark: ATS.onDark,
    paper: c.bodyBgColor || ATS.paper,
    size: (c.pageFormat === "letter" ? "LETTER" : "A4") as "LETTER" | "A4",
    dateFmt: c.dateFormat,
  };
}

/** Section-heading transform + tracking, mirroring `headingCapStyle`. */
export function headingCapStyle(c: Customization) {
  if (headingLang(c) === "km") {
    return { textTransform: "none" as const, letterSpacing: 0 };
  }
  const transform = c.capitalization ?? "uppercase";
  const tracking =
    c.headingsLetterSpacing ?? (transform === "uppercase" ? 1.1 : 0.2);
  return {
    textTransform: transform as "uppercase" | "capitalize",
    letterSpacing: tracking * PX_TO_PT,
  };
}

/* --------------------------------------------------------------------- *
 * Section assembly - orders the five movable blocks and splits them into
 * main/sidebar exactly the way each preview layout does, so the user's
 * "Change Section Layout" choices survive into the PDF.
 * --------------------------------------------------------------------- */

export type SectionBlocks = Partial<Record<SpecialSectionKey, ReactNode>>;

/** Section blocks are written inline in each layout, so they carry no key -
 *  stamp the section name on as we order them, since they end up in arrays. */
function ordered(keys: SpecialSectionKey[], blocks: SectionBlocks) {
  return keys
    .map((key) => {
      const node = blocks[key];
      if (!node) return null;
      return isValidElement(node) ? cloneElement(node, { key }) : node;
    })
    .filter(Boolean);
}

export function partitionBlocks(t: PdfTheme, blocks: SectionBlocks) {
  const { main, sidebar } = partitionSpecialSectionOrder(
    t.c.specialSectionOrder,
    t.c.specialSidebarKeys,
  );
  return {
    main: ordered(main, blocks),
    sidebar: ordered(sidebar, blocks),
  };
}

/** Header name + job title, honoring the fullName/jobTitle toggles, their
 *  sizes, and contrast against whatever they sit on. */
export function headerColors(t: PdfTheme, on: string) {
  const { c } = t;
  return {
    name: contrastOn(on, c.toggles.fullName ? t.accent : t.ink),
    title: contrastOn(on, c.toggles.jobTitle ? t.accent : t.muted),
  };
}
