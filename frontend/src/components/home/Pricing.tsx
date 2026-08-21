import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/UseAuth";
import { setPendingPlan } from "../../lib/pendingPlan";
import type { PlanId } from "../../types/billing";

type NeedId = "design" | "ai" | "both";

interface PackCopy {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const NEED_IDS: NeedId[] = ["design", "ai", "both"];
const AI_PLAN_IDS: PlanId[] = ["starter", "starter", "pro"];
const BOTH_PLAN_IDS: PlanId[] = ["starter", "starter", "pro"];

function FeatureCheck({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-5 text-text">
      <Check className="mt-0.5 shrink-0 text-brand" size={16} strokeWidth={2.5} />
      {children}
    </li>
  );
}

export default function Pricing() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [need, setNeed] = useState<NeedId>("both");

  const handlePlanClick = (planId: PlanId) => {
    if (loading) return;
    if (planId === "free") {
      navigate(user ? "/dashboard" : "/login");
      return;
    }
    if (user) {
      navigate("/billing/payment", { state: { plan: planId } });
    } else {
      setPendingPlan(planId);
      navigate("/login");
    }
  };

  const aiPacks = t("home.pricing.ai.packs", {
    returnObjects: true,
  }) as PackCopy[];
  const bothPacks = t("home.pricing.both.packs", {
    returnObjects: true,
  }) as PackCopy[];

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <h2 className="text-center text-3xl font-bold md:text-4xl">
        {t("home.pricing.title")}{" "}
        <span className="text-brand italic">
          {t("home.pricing.titleAccent")}
        </span>
      </h2>
      <p className="mx-auto mt-3 max-w-md text-center text-sm text-text-secondary sm:text-base">
        {t("home.pricing.subtitle")}
      </p>

      <div
        role="radiogroup"
        aria-label={t("home.pricing.needLabel")}
        className="mt-8 flex justify-center sm:mt-10"
      >
        <div className="inline-flex rounded-full bg-surface-2 p-1">
          {NEED_IDS.map((id) => {
            const selected = need === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setNeed(id)}
                className={cn(
                  "rounded-full px-3.5 py-2 text-xs font-medium transition-colors min-[375px]:px-4 min-[375px]:text-sm",
                  selected ? "bg-brand text-white" : "text-text-secondary",
                )}
              >
                {t(`home.pricing.needs.${id}.title`)}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {need === "design" && (
          <motion.div
            key="design"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mx-auto mt-8 max-w-sm sm:mt-10"
          >
            <PackCard
              pack={{
                name: t("home.pricing.design.name"),
                price: t("home.pricing.design.price"),
                period: t("home.pricing.design.period"),
                features: [t("home.pricing.design.desc")],
                cta: t("home.pricing.design.cta"),
                popular: true,
              }}
              badge={t("home.pricing.mostPopular")}
              loading={loading}
              onSelect={() => handlePlanClick("starter")}
            />
          </motion.div>
        )}

        {need === "ai" && (
          <motion.div
            key="ai"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-8 sm:mt-10"
          >
            <PackCarousel
              packs={aiPacks}
              popularBadge={t("home.pricing.mostPopular")}
              loading={loading}
              planIds={AI_PLAN_IDS}
              onSelect={handlePlanClick}
            />
          </motion.div>
        )}

        {need === "both" && (
          <motion.div
            key="both"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-8 sm:mt-10"
          >
            <PackCarousel
              packs={bothPacks}
              popularBadge={t("home.pricing.bestValue")}
              loading={loading}
              planIds={BOTH_PLAN_IDS}
              onSelect={handlePlanClick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-8 text-center text-sm text-text-secondary">
        {t("home.pricing.freeNote")}{" "}
        <button
          type="button"
          disabled={loading}
          onClick={() => handlePlanClick("free")}
          className="font-semibold text-brand underline-offset-2 hover:underline disabled:opacity-50"
        >
          {t("home.pricing.freeCta")}
        </button>
      </p>
    </section>
  );
}

function PackCarousel({
  packs,
  popularBadge,
  loading,
  planIds,
  onSelect,
}: {
  packs: PackCopy[];
  popularBadge: string;
  loading: boolean;
  planIds: PlanId[];
  onSelect: (planId: PlanId) => void;
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

  return (
    <div>
      <div
        ref={scrollerRef}
        className={cn(
          "-mx-4 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-4",
          "cursor-grab touch-pan-x active:cursor-grabbing md:cursor-auto",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "md:mx-0 md:grid md:grid-cols-3 md:items-stretch md:gap-5 md:overflow-visible md:px-0 md:snap-none",
        )}
      >
        {packs.map((pack, i) => (
          <div
            key={pack.name}
            className="w-[min(100%,20.5rem)] shrink-0 snap-center md:w-auto md:min-w-0 md:snap-align-none"
          >
            <PackCard
              pack={pack}
              badge={pack.popular ? popularBadge : undefined}
              loading={loading}
              onSelect={() => onSelect(planIds[i])}
            />
          </div>
        ))}
      </div>

      {packs.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-1.5 md:hidden">
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

function PackCard({
  pack,
  badge,
  loading,
  onSelect,
}: {
  pack: PackCopy;
  badge?: string;
  loading: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-bg p-5 text-left min-[375px]:p-6",
        pack.popular ? "border-brand" : "border-line",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-semibold text-text">{pack.name}</p>
        {badge ? (
          <span className="text-[11px] font-medium text-brand">{badge}</span>
        ) : null}
      </div>

      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[2rem] font-bold leading-none tracking-tight">
          ${pack.price}
        </span>
        {pack.period ? (
          <span className="text-sm text-text-secondary">{pack.period}</span>
        ) : null}
      </p>

      <div className="mt-5 flex min-h-0 flex-1 flex-col border-t border-line pt-4">
        <ul className="space-y-2.5">
          {pack.features.map((feature) => (
            <FeatureCheck key={feature}>{feature}</FeatureCheck>
          ))}
        </ul>
      </div>

      <Button className="mt-6 w-full" disabled={loading} onClick={onSelect}>
        {pack.cta}
      </Button>
    </div>
  );
}
