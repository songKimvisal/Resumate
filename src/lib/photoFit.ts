import type { PersonalInfo } from "../types/resume";

/** Inline style for the photo <img> given its fit mode — shared by the
 *  builder's editable thumbnail and the read-only resume preview so both
 *  always render identically.
 *  "fill" / "fit" behave like Figma's Fill/Fit: object-fit cover/contain,
 *  centered. "crop" keeps the cover baseline but layers a user-adjustable
 *  scale + pan on top (photoZoom / photoPosition, in percent so they scale
 *  to any frame size). */
export function photoImgStyle(
  personal: Pick<PersonalInfo, "photoFit" | "photoZoom" | "photoPosition">,
): React.CSSProperties {
  const { photoFit, photoZoom, photoPosition } = personal;
  const zoom = photoFit === "crop" ? photoZoom : 1;
  const { x, y } = photoFit === "crop" ? photoPosition : { x: 0, y: 0 };
  return {
    width: "100%",
    height: "100%",
    objectFit: photoFit === "fit" ? "contain" : "cover",
    transform: `scale(${zoom}) translate(${x}%, ${y}%)`,
  };
}
