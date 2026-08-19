import type { Customization } from "../types/resume";

export const PAGE_SIZE_MM: Record<
  Customization["pageFormat"],
  { width: number; height: number }
> = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
};

export function marginPercentCss(
  mm: number,
  pageFormat: Customization["pageFormat"],
) {
  return (mm / PAGE_SIZE_MM[pageFormat].width) * 100;
}

export function marginPercentPdf(
  mm: number,
  axis: "vertical" | "horizontal",
  pageFormat: Customization["pageFormat"],
) {
  const { width, height } = PAGE_SIZE_MM[pageFormat];
  return (mm / (axis === "vertical" ? height : width)) * 100;
}
