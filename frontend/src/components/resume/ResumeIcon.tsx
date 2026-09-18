import { ICON_SHAPES, type IconKey } from "../../lib/resumeIcons";
export function ResumeIcon({
  icon,
  className,
  strokeWidth = 2,
}: {
  icon: IconKey;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_SHAPES[icon].map((shape, i) =>
        shape.type === "circle" ? (
          <circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} />
        ) : shape.type === "rect" ? (
          <rect
            key={i}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            rx={shape.rx}
          />
        ) : (
          <path key={i} d={shape.d} />
        ),
      )}
    </svg>
  );
}
