import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import type { PurchasePack } from "../../hooks/usePacks";
import type { NeedId } from "../../types/billing";

const NEED_IDS: NeedId[] = ["design", "ai", "both"];

export function NeedTabs({
  value,
  onChange,
  label,
  ids = NEED_IDS,
  className,
  align = "center",
}: {
  value: NeedId;
  onChange: (id: NeedId) => void;
  label: string;
  ids?: NeedId[];
  className?: string;
  align?: "center" | "start";
}) {
  const { t } = useTranslation();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex",
        align === "start" ? "justify-center lg:justify-start" : "justify-center",
        className,
      )}
    >
      <div
        className={cn(
          "grid w-full max-w-[26rem] rounded-full bg-surface-2 p-[3px]",
          ids.length === 2 ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        {ids.map((id) => {
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
  contained = false,
  columns = 3,
  className,
}: {
  packs: Omit<PurchasePack, "id">[];
  popularBadge: string;
  loading?: boolean;
  /** Called with the pack's index in `packs` (not a PackId - some callers,
   * like the flat template tiers, aren't real packs). */
  onSelect: (index: number) => void;
  contained?: boolean;
  /** How many columns the grid settles into once it stops scrolling
   * (md/lg breakpoint, see `gridMin` below). Most packs come in 3s; the
   * flat template tiers come in 2s. */
  columns?: 2 | 3;
  className?: string;
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

  const gridMin = contained ? "(min-width: 1024px)" : "(min-width: 768px)";

  useEffect(() => {
    if (window.matchMedia(gridMin).matches) return;
    const start = packs.findIndex((p) => p.popular);
    const id = requestAnimationFrame(() =>
      scrollToIndex(start >= 0 ? start : 0, "auto"),
    );
    return () => cancelAnimationFrame(id);
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
      if (window.matchMedia(gridMin).matches) return;
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
    <div className={className}>
      <div
        ref={scrollerRef}
        className={cn(
          "grid items-stretch gap-3 overflow-x-auto",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "snap-x snap-mandatory cursor-grab touch-pan-x active:cursor-grabbing",
          contained
            ? cn(
                "auto-cols-[minmax(15.5rem,calc(100%-1.5rem))] grid-flow-col lg:cursor-auto lg:grid-flow-row lg:auto-cols-auto lg:gap-3 lg:overflow-visible lg:snap-none",
                columns === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3",
              )
            : cn(
                "-mx-4 auto-cols-[min(100%,20.5rem)] grid-flow-col px-4 md:mx-0 md:cursor-auto md:grid-flow-row md:auto-cols-auto md:gap-5 md:overflow-visible md:px-0 md:snap-none",
                columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3",
              ),
        )}
      >
        {packs.map((pack, i) => (
          <div
            key={pack.name}
            className={cn(
              "flex h-full min-h-full snap-center",
              contained
                ? "lg:min-w-0 lg:snap-align-none"
                : "md:min-w-0 md:snap-align-none",
            )}
          >
            <PackCard
              pack={pack}
              badge={pack.popular ? popularBadge : undefined}
              loading={loading}
              onSelect={() => onSelect(i)}
              compact={contained}
            />
          </div>
        ))}
      </div>

      {packs.length > 1 && (
        <div
          className={cn(
            "mt-4 flex items-center justify-center gap-1.5",
            contained ? "lg:hidden" : "md:hidden",
          )}
        >
          {packs.map((pack, i) => (
            <button
              key={pack.name}
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

/**
 * "Just templates" tab: the two flat, a-la-carte purchases ($1 customization
 * unlock, $1.99 premium template) shown as swipeable cards, matching the AI
 * and Both tabs' carousel. The free tier isn't repeated here - it's already
 * covered by the "Or start free..." line under the pricing section. Neither
 * card is an abstract checkout you can complete from this tab: customization
 * needs a template already picked, a premium template needs to be chosen -
 * so the CTAs route the viewer into the builder/marketplace instead.
 */
export function TemplateTierCards({
  onSelect,
}: {
  onSelect: (tier: 1 | 2) => void;
}) {
  const { t } = useTranslation();
  const tiers = t("home.pricing.design.tiers", {
    returnObjects: true,
  }) as {
    name: string;
    price: string;
    period: string;
    features: string[];
    cta: string;
    popular?: boolean;
  }[];
  const bestValueBadge = t("home.pricing.bestValue");

  return (
    <PackCarousel
      packs={tiers}
      popularBadge={bestValueBadge}
      columns={2}
      className="mx-auto max-w-2xl"
      onSelect={(i) => onSelect((i + 1) as 1 | 2)}
    />
  );
}

export function PackCard({
  pack,
  badge,
  loading = false,
  onSelect,
  compact = false,
}: {
  pack: Omit<PurchasePack, "id">;
  badge?: string;
  loading?: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-full w-full flex-1 flex-col rounded-2xl border text-left transition-shadow",
        compact ? "p-3.5 sm:p-4" : "p-4 sm:p-5",
        pack.popular
          ? "border-brand bg-brand/[0.04] shadow-[0_0_0_1px] shadow-brand/15"
          : "border-line bg-bg",
      )}
    >
      <div className="flex h-5 items-start justify-between gap-2">
        <p className="text-base font-semibold leading-5 text-text">{pack.name}</p>
        <span
          className={cn(
            "shrink-0 text-[11px] font-medium leading-5",
            badge
              ? "rounded-full bg-brand/10 px-2 text-brand"
              : "invisible px-2",
          )}
        >
          {badge ?? "Best value"}
        </span>
      </div>

      <p className={cn("mt-2 flex items-baseline gap-1.5", compact && "mt-1.5")}>
        <span
          className={cn(
            "font-bold leading-none tracking-tight",
            compact ? "text-[1.75rem]" : "text-[2rem]",
          )}
        >
          ${pack.price}
        </span>
        {pack.period ? (
          <span className="text-sm text-text-secondary">{pack.period}</span>
        ) : null}
      </p>

      <ul
        className={cn(
          "flex-1 border-t border-line",
          compact ? "mt-3 space-y-2 pt-3" : "mt-4 space-y-2.5 pt-4",
        )}
      >
        {pack.features.map((feature, i) => (
          <FeatureCheck key={`${pack.name}-feat-${i}`}>{feature}</FeatureCheck>
        ))}
      </ul>

      <Button
        size="compact"
        className={cn("h-9 w-full", compact ? "mt-4" : "mt-5")}
        disabled={loading}
        onClick={onSelect}
      >
        {pack.cta}
      </Button>
    </div>
  );
}
