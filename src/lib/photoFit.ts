import type { PersonalInfo } from "../types/resume";

/** Inline style for the photo <img>, shared by the builder thumbnail and
 *  the resume preview so both render identically. "fill"/"fit" map to
 *  object-fit cover/contain; "crop" adds a user pan/zoom on top of cover. */
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
