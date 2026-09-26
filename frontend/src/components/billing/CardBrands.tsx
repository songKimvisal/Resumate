import { CreditCard } from "lucide-react";
import { cn } from "../../lib/utils";

const CARD_BRANDS = [
  { name: "Visa", src: "/payment/visa.svg" },
  { name: "Mastercard", src: "/payment/mastercard.svg" },
  { name: "UnionPay", src: "/payment/unionpay.svg" },
  { name: "JCB", src: "/payment/jcb.svg" },
];

// White chips keep the marks readable in dark mode.
const chip =
  "flex h-6 w-9 shrink-0 items-center justify-center rounded border border-line bg-white";

/** Required by PayWay's merchant guidelines. */
export function CardBrandLogos({ className }: { className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {CARD_BRANDS.map((brand) => (
        <span key={brand.name} className={chip}>
          <img
            src={brand.src}
            alt={brand.name}
            className="max-h-4 max-w-7"
            loading="lazy"
          />
        </span>
      ))}
    </span>
  );
}

export function CardBrandLogo({ brand }: { brand: string }) {
  const match = CARD_BRANDS.find(
    (b) => b.name.toLowerCase() === brand.toLowerCase(),
  );
  return (
    <span className={chip}>
      {match ? (
        <img src={match.src} alt={match.name} className="max-h-4 max-w-7" />
      ) : (
        <CreditCard size={16} className="text-text-secondary" />
      )}
    </span>
  );
}

export function PaymentMethodLogo({ method }: { method: "khqr" | "stripe" }) {
  return (
    <span className="flex h-8 w-11 shrink-0 items-center justify-center">
      {method === "khqr" ? (
        <img src="/payment/bakong.svg" alt="Bakong" className="size-8" />
      ) : (
        <img
          src="/payment/payway-card.svg"
          alt="ABA PayWay"
          className="h-[26px] w-11"
        />
      )}
    </span>
  );
}
