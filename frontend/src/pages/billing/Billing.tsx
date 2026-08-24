import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { QrCode, CreditCard, Lock } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../lib/utils";
import { formatCardNumber, formatExpiry, detectCardBrand } from "../../lib/cardFormat";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import { usePricingPlans } from "../../hooks/usePricingPlans";
import { usePacks } from "../../hooks/usePacks";
import UpgradePlanModal from "./UpgradePlanModal";
import mascot from "../../assets/logo/mascot.png";

type PaymentMethod = "khqr" | "stripe";

const USAGE = { used: 3, total: 5 };
const NEXT_BILLING_DATE = "19 Jul 2026";

export default function Billing() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const plan = useSubscriptionStore((s) => s.plan);
  const lastPackId = useSubscriptionStore((s) => s.lastPackId);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const pricingPlans = usePricingPlans();
  const { all: packs } = usePacks();
  const currentPack = packs.find((p) => p.id === lastPackId);
  const CURRENT_PLAN =
    currentPack ??
    pricingPlans.find((p) => p.id === plan) ??
    pricingPlans[0];

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("khqr");
  const [editingMethod, setEditingMethod] = useState(false);
  const [draftMethod, setDraftMethod] = useState<PaymentMethod>(paymentMethod);

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [savedCard, setSavedCard] = useState<{
    brand: string;
    last4: string;
  } | null>(null);

  const usagePercent = Math.min(
    100,
    Math.round((USAGE.used / USAGE.total) * 100),
  );

  const isStripeFormValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    /^\d{2}\/\d{2}$/.test(cardExpiry) &&
    cardCvc.length >= 3 &&
    cardName.trim().length > 0;

  const canSaveMethod = draftMethod === "khqr" || isStripeFormValid;

  const openMethodEditor = () => {
    setDraftMethod(paymentMethod);
    setEditingMethod(true);
  };

  const saveMethod = () => {
    if (!canSaveMethod) return;
    if (draftMethod === "stripe") {
      const digits = cardNumber.replace(/\s/g, "");
      setSavedCard({ brand: detectCardBrand(digits), last4: digits.slice(-4) });
    }
    setPaymentMethod(draftMethod);
    setEditingMethod(false);
  };

  const paymentMethodDisplay =
    paymentMethod === "khqr"
      ? t("billing.paymentMethod.khqr.name")
      : savedCard
        ? `${savedCard.brand} •••• ${savedCard.last4}`
        : t("billing.paymentMethod.stripe.name");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold">
        <span className="text-text">{t("billing.title")}</span>{" "}
        <span className="text-brand italic">{t("billing.titleAccent")}</span>
      </h1>
      <p className="text-sm text-text-secondary mt-2">
        {t("billing.subtitle")}
      </p>

      <div className="mt-8 flex items-center gap-6">
        <div className="w-full max-w-md rounded-2xl border border-brand p-5 sm:p-6">
          <p className="font-bold text-text">
            {t("billing.currentPlan.label")}
          </p>

          <p className="mt-3 flex items-baseline gap-2">
            <span className="font-bold text-text">{CURRENT_PLAN.name}</span>
            <span className="text-3xl font-extrabold text-brand">
              {CURRENT_PLAN.price === "0"
                ? t("billing.currentPlan.freePrice")
                : `$${CURRENT_PLAN.price}`}
              <span className="ml-1 text-base font-semibold">
                {t("billing.currentPlan.paidOnce")}
              </span>
            </span>
          </p>

          <p className="mt-5 text-sm text-text">
            {t("billing.currentPlan.creditsLabel")}
          </p>
          <div className="mt-2 h-2.5 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-[width]"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            {t("billing.currentPlan.usageCount", {
              used: USAGE.used,
              total: USAGE.total,
            })}
          </p>

          <Button
            className="mt-5 w-full"
            onClick={() => setUpgradeModalOpen(true)}
          >
            {t("billing.currentPlan.upgradeCta")}
          </Button>
        </div>

        <img
          src={mascot}
          alt=""
          className="hidden sm:block w-40 shrink-0 select-none"
        />
      </div>

      <div className="mt-6 w-full max-w-2xl rounded-2xl border border-line">
        <div className="p-4 sm:p-6 overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
          {editingMethod ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <p className="font-medium text-text">
                {t("billing.paymentMethod.label")}
              </p>
              <p className="text-sm text-text-secondary mt-0.5">
                {t("billing.paymentMethod.chooseSubtitle")}
              </p>

              <div className="mt-4 space-y-3">
                {(["khqr", "stripe"] as const).map((method) => {
                  const Icon = method === "khqr" ? QrCode : CreditCard;
                  const selected = draftMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setDraftMethod(method)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                        selected
                          ? "border-brand"
                          : "border-line hover:border-brand/50",
                      )}
                    >
                      <Icon
                        size={20}
                        className={cn(
                          selected ? "text-brand" : "text-text-secondary",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-text">
                          {t(`billing.paymentMethod.${method}.name`)}
                        </span>
                        <span className="block text-sm text-text-secondary">
                          {t(`billing.paymentMethod.${method}.desc`)}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "size-4 rounded-full border-2 shrink-0 transition-colors duration-200",
                          selected
                            ? "border-brand bg-brand"
                            : "border-line",
                        )}
                      />
                    </button>
                  );
                })}
              </div>

              <AnimatePresence initial={false}>
                {draftMethod === "stripe" && (
                  <motion.div
                    key="card-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 rounded-xl border border-line p-4 space-y-4">
                      <Input
                        label={t("billing.paymentMethod.card.nameLabel")}
                        placeholder={t(
                          "billing.paymentMethod.card.namePlaceholder",
                        )}
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                      <Input
                        label={t("billing.paymentMethod.card.numberLabel")}
                        placeholder="4242 4242 4242 4242"
                        inputMode="numeric"
                        value={cardNumber}
                        onChange={(e) =>
                          setCardNumber(formatCardNumber(e.target.value))
                        }
                      />
                      <div className="flex gap-4">
                        <Input
                          label={t("billing.paymentMethod.card.expiryLabel")}
                          placeholder="MM/YY"
                          inputMode="numeric"
                          value={cardExpiry}
                          onChange={(e) =>
                            setCardExpiry(formatExpiry(e.target.value))
                          }
                          className="flex-1"
                        />
                        <Input
                          label={t("billing.paymentMethod.card.cvcLabel")}
                          placeholder="123"
                          inputMode="numeric"
                          value={cardCvc}
                          onChange={(e) =>
                            setCardCvc(
                              e.target.value.replace(/\D/g, "").slice(0, 4),
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Lock size={12} strokeWidth={2} />
                        {t("billing.paymentMethod.card.secureNote")}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-5 flex items-center justify-end gap-3">
                <Button
                  size="compact"
                  variant="outline"
                  onClick={() => setEditingMethod(false)}
                >
                  {t("billing.paymentMethod.cancel")}
                </Button>
                <Button
                  size="compact"
                  disabled={!canSaveMethod}
                  onClick={saveMethod}
                >
                  {t("billing.paymentMethod.save")}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="collapsed"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={openMethodEditor}
              className="w-full flex items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-text">{t("billing.paymentMethod.label")}</p>
                <p className="text-sm text-text-secondary mt-0.5">
                  {t("billing.paymentMethod.nextBilling", {
                    date: NEXT_BILLING_DATE,
                  })}
                </p>
              </div>
              <span className="text-brand font-medium shrink-0">
                {paymentMethodDisplay}
              </span>
            </motion.button>
          )}
          </AnimatePresence>
        </div>

        <div className="border-t border-line p-4 sm:p-6 flex items-center justify-between gap-3">
          <p className="text-text">{t("billing.billingHistory.label")}</p>
          <button
            type="button"
            onClick={() => navigate("/billing/history")}
            className="text-brand font-medium hover:underline"
          >
            {t("billing.billingHistory.viewInvoices")}
          </button>
        </div>
      </div>

      <UpgradePlanModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onSelectPack={(packId) => {
          setUpgradeModalOpen(false);
          navigate("/billing/payment", { state: { pack: packId } });
        }}
      />
    </div>
  );
}
