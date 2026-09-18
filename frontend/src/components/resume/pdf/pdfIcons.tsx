import { Svg, Path, Circle, Rect } from "@react-pdf/renderer";
import { ICON_SHAPES, type IconKey } from "../../../lib/resumeIcons";

export type { IconKey };

export function PdfIcon({
  icon,
  size,
  color,
}: {
  icon: IconKey;
  size: number;
  color: string;
}) {
  const stroke = {
    stroke: color,
    strokeWidth: 2,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {ICON_SHAPES[icon].map((shape, i) =>
        shape.type === "circle" ? (
          <Circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} {...stroke} />
        ) : shape.type === "rect" ? (
          <Rect
            key={i}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            rx={shape.rx}
            {...stroke}
          />
        ) : (
          <Path key={i} d={shape.d} {...stroke} />
        ),
      )}
    </Svg>
  );
}
