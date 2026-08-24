import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import type { PurchasePack } from "../../hooks/usePacks";
import type { NeedId, PackId } from "../../types/billing";

const NEED_IDS: NeedId[] = ["design", "ai", "both"];

export function NeedTabs({
  value,
  onChange,
  label,
}: {
  value: NeedId;
  onChange: (id: NeedId) => void;
  label: string;
}) {
  const { t } = useTranslation();

  return (
    <div role="radiogroup" aria-label={label} className="flex justify-center">
      <div className="grid w-full max-w-[20.5rem] grid-cols-3 rounded-full bg-surface-2 p-[3px]">
        {NEED_IDS.map((id) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(id)}
              className={cn(
                "h-8 rounded-full px-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm",
                selected ? "bg-brand text-white" : "text-text-secondary",
              )}
            >
              {t(`home.pricing.needs.${id}.title`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FeatureCheck({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-5 text-text">
      <Check className="mt-0.5 shrink-0 text-brand" size={16} strokeWidth={2.5} />
      {children}
    </li>
  );
}

export function PackCarousel({
  packs,
  popularBadge,
  loading = false,
  onSelect,
}: {
  packs: PurchasePack[];
  popularBadge: string;
  loading?: boolean;
  onSelect: (packId: PackId) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(() => {
    const i = packs.findIndex((p) => p.popular);
    return i >= 0 ? i : 0;
  });

  const scrollToIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
    const scroller = scrollerRef.current;
    const child = scroller?.children[index] as HTMLElement | undefined;
    if (!scroller || !child) return;
    const left =
      child.offsetLeft - (scroller.clientWidth - child.offsetWidth) / 2;
    scroller.scrollTo({ left, behavior });
    setActive(index);
  };

  const indexFromScroll = (el: HTMLElement) => {
    const target = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const node = child as HTMLElement;
      const dist = Math.abs(node.offsetLeft + node.offsetWidth / 2 - target);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  };

  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) return;
    const start = packs.findIndex((p) => p.popular);
    const id = requestAnimationFrame(() =>
      scrollToIndex(start >= 0 ? start : 0, "auto"),
    );
    return () => cancelAnimationFrame(id);
    // Mount once per pack set — parent remounts with key={need}.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => setActive(indexFromScroll(el));
    const canScroll = () => el.scrollWidth > el.clientWidth + 1;

    const onWheel = (e: WheelEvent) => {
      if (!canScroll()) return;
      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      const max = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + delta;
      if (
        (next <= 0 && el.scrollLeft <= 0) ||
        (next >= max && el.scrollLeft >= max - 1)
      ) {
        return;
      }
      e.preventDefault();
      el.scrollLeft = Math.max(0, Math.min(max, next));
    };

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !canScroll()) return;
      if ((e.target as HTMLElement).closest("button")) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      dragged = false;
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) dragged = true;
      el.scrollLeft = startScroll - dx;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
      if (dragged) scrollToIndex(indexFromScroll(el));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const slides = () => Array.from(scroller.children) as HTMLElement[];

    const equalize = () => {
      const items = slides();
      items.forEach((item) => {
        item.style.minHeight = "";
      });
      if (window.matchMedia("(min-width: 768px)").matches) return;
      const max = items.reduce((m, item) => Math.max(m, item.offsetHeight), 0);
      if (max <= 0) return;
      items.forEach((item) => {
        item.style.minHeight = `${max}px`;
      });
    };

    const id = requestAnimationFrame(equalize);
    window.addEventListener("resize", equalize);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", equalize);
      slides().forEach((item) => {
        item.style.minHeight = "";
      });
    };
  }, [packs]);

  return (
    <div>
      <div
        ref={scrollerRef}
        className={cn(
          "-mx-4 grid auto-cols-[min(100%,20.5rem)] grid-flow-col items-stretch gap-3 overflow-x-auto px-4",
          "snap-x snap-mandatory cursor-grab touch-pan-x active:cursor-grabbing md:cursor-auto",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "md:mx-0 md:grid-flow-row md:grid-cols-3 md:auto-cols-auto md:gap-5 md:overflow-visible md:px-0 md:snap-none",
        )}
      >
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="flex h-full min-h-full snap-center md:min-w-0 md:snap-align-none"
          >
            <PackCard
              pack={pack}
              badge={pack.popular ? popularBadge : undefined}
              loading={loading}
              onSelect={() => onSelect(pack.id)}
            />
          </div>
        ))}
      </div>

      {packs.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-1.5 md:hidden">
          {packs.map((pack, i) => (
            <button
              key={pack.id}
              type="button"
              aria-label={pack.name}
              aria-current={i === active}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === active ? "w-4 bg-brand" : "w-1.5 bg-line",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PackCard({
  pack,
  badge,
  loading = false,
  onSelect,
}: {
  pack: PurchasePack;
  badge?: string;
  loading?: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-full w-full flex-1 flex-col rounded-2xl border bg-bg p-5 text-left",
        pack.popular ? "border-brand" : "border-line",
      )}
    >
      <div className="flex h-5 items-start justify-between gap-2">
        <p className="text-base font-semibold leading-5 text-text">{pack.name}</p>
        <span
          className={cn(
            "shrink-0 text-[11px] font-medium leading-5",
            badge ? "text-brand" : "invisible",
          )}
        >
          {badge ?? "Best value"}
        </span>
      </div>

      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[2rem] font-bold leading-none tracking-tight">
          ${pack.price}
        </span>
        {pack.period ? (
          <span className="text-sm text-text-secondary">{pack.period}</span>
        ) : null}
      </p>

      <ul className="mt-4 flex-1 space-y-2.5 border-t border-line pt-4">
        {pack.features.map((feature) => (
          <FeatureCheck key={feature}>{feature}</FeatureCheck>
        ))}
      </ul>

      <Button
        size="compact"
        className="mt-5 h-9 w-full"
        disabled={loading}
        onClick={onSelect}
      >
        {pack.cta}
      </Button>
    </div>
  );
}
