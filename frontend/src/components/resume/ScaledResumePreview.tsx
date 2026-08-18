import { useEffect, useRef, useState } from "react";
import type { Resume } from "../../types/resume";
import ResumePreview from "./ResumePreview";
import { cn } from "../../lib/utils";

// ResumePreview renders at a fixed native width. A4 @ 96dpi is the common
// default (~794px) — if your ResumePreview renders at a different pixel
// width, change this one constant; everything else scales off it.
export const RESUME_PREVIEW_NATIVE_WIDTH = 794;

interface ScaledResumePreviewProps {
  resume: Resume;
  className?: string;
}

/**
 * Renders the real ResumePreview (same component ResumeCard.tsx uses on
 * MyResumes) scaled down to fit whatever width its container has. Measures
 * the container via ResizeObserver rather than a single hardcoded scale
 * factor, so it stays correct across breakpoints and container sizes.
 */
export default function ScaledResumePreview({
  resume,
  className,
}: ScaledResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      setScale(width > 0 ? width / RESUME_PREVIEW_NATIVE_WIDTH : 0);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full aspect-[210/297] overflow-hidden rounded-md border border-line bg-white shadow-sm",
        className,
      )}
    >
      {scale > 0 && (
        <div
          className="origin-top-left pointer-events-none"
          style={{
            width: RESUME_PREVIEW_NATIVE_WIDTH,
            transform: `scale(${scale})`,
          }}
        >
          <ResumePreview singlePage resume={resume} />
        </div>
      )}
    </div>
  );
}
