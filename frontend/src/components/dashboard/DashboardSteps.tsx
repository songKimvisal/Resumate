import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";

const STEPS = [
  "dashboard.steps.selectResume",
  "dashboard.steps.resumeOptimization",
  "dashboard.steps.interviewPrep",
  "dashboard.steps.jobReadinessReport",
] as const;

/** 0-based index of the current active step in the readiness journey. */
export default function DashboardSteps({ activeIndex }: { activeIndex: number }) {
  const { t } = useTranslation();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = activeRef.current;
    if (!scroller || !active) return;

    const left =
      active.offsetLeft - scroller.clientWidth / 2 + active.offsetWidth / 2;
    scroller.scrollTo({
      left: Math.max(0, left),
      behavior: "smooth",
    });
  }, [activeIndex]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const canScroll = () => el.scrollWidth > el.clientWidth + 1;

    const onWheel = (e: WheelEvent) => {
      if (!canScroll()) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;

      const max = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + delta;
      if ((next <= 0 && el.scrollLeft <= 0) || (next >= max && el.scrollLeft >= max - 1)) {
        return;
      }

      e.preventDefault();
      el.scrollLeft = Math.max(0, Math.min(max, next));
    };

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !canScroll()) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      el.scrollLeft = startScroll - (e.clientX - startX);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <div
      ref={scrollerRef}
      className={cn(
        "min-w-0 max-w-full overflow-x-auto overscroll-x-contain",
        "cursor-grab touch-pan-x select-none active:cursor-grabbing",
        "[-ms-overflow-style:none] [scrollbar-width:none]",
        "[&::-webkit-scrollbar]:hidden",
      )}
    >
      <div className="flex w-max items-center">
        {STEPS.map((step, index) => {
          const isActive = index <= activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <div key={step} className="flex shrink-0 items-center">
              <span
                ref={isCurrent ? activeRef : undefined}
                className={cn(
                  "inline-flex items-center justify-center rounded-full border",
                  "px-3 py-2 text-[11px] font-semibold leading-none whitespace-nowrap",
                  "min-[375px]:px-3.5 min-[375px]:text-xs",
                  "sm:px-5 sm:py-2.5 sm:text-sm",
                  isActive
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-line bg-surface-2 text-text-secondary",
                )}
              >
                {t(step)}
              </span>

              {index < STEPS.length - 1 && (
                <span
                  className={cn(
                    "mx-1.5 h-px w-4 shrink-0 min-[375px]:w-5 sm:mx-2 sm:w-10 lg:w-16",
                    index < activeIndex
                      ? "bg-gradient-to-r from-brand to-brand/40"
                      : index === activeIndex
                        ? "bg-gradient-to-r from-brand to-line"
                        : "bg-line",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
