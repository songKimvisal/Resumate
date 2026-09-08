import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PREMIUM_TEMPLATE_PRICE } from "../../lib/templateAccess";
import { cn } from "../../lib/utils";

export default function PremiumLockOverlay({
  size = "md",
  canClaim = false,
  interactive = false,
  onUnlock,
  className,
}: {
  size?: "sm" | "md";
  canClaim?: boolean;
  interactive?: boolean;
  onUnlock?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const small = size === "sm";

  const label = canClaim
    ? t("marketplace.premiumOverlay.claimBadge")
    : t("marketplace.premiumOverlay.unlockShort", {
        price: PREMIUM_TEMPLATE_PRICE,
      });

  const Cta = interactive ? "button" : "span";

  return (
    <div className={cn("absolute inset-0", className)}>
      <span
        className={cn(
          "absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-linear-to-br from-brand to-brand-secondary text-white shadow-md shadow-black/30 ring-2 ring-white/60 transition-transform duration-200 group-hover:scale-110",
          small ? "size-6" : "size-11",
        )}
      >
        <Lock size={small ? 11 : 19} strokeWidth={2.5} />
      </span>

      {!small && (
        <div className="absolute inset-x-2 top-1/2 mt-7 flex justify-center">
          <Cta
            {...(interactive
              ? { type: "button" as const, onClick: onUnlock }
              : {})}
            className="max-w-full truncate rounded-full bg-neutral-900 px-3 py-1 text-[11px] leading-tight font-semibold text-white shadow-md ring-1 ring-white/25"
          >
            {label}
          </Cta>
        </div>
      )}
    </div>
  );
}
