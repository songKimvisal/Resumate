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

export function sp(step: number) {
  return step * 4 * PX_TO_PT;
}

export const FONT_SIZE_RATIO = PX_TO_PT;

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
