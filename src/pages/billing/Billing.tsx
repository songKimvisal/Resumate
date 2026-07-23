import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { QrCode, CreditCard, Loader2, CheckCircle2, Lock } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../lib/utils";
import mascot from "../../assets/logo/mascot.png";

type PaymentMethod = "khqr" | "stripe";

const CURRENT_PLAN = { name: "Free", price: "0" };
const USAGE = { used: 3, total: 5 };
const NEXT_BILLING_DATE = "19 Jul 2026";

const formatCardNumber = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

const detectCardBrand = (digits: string) => {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^62/.test(digits)) return "UnionPay";
  return "Card";
};

export default function Billing() {
  const { t } = useTranslation();
  const navigate = useNavigate();

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

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

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

  const handleCancelSubscription = async () => {
    setCancelling(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setCancelling(false);
    setCancelled(true);
    setConfirmingCancel(false);
  };

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
              ${CURRENT_PLAN.price}
              <span className="text-base font-semibold">
                {t("billing.currentPlan.perMonth")}
              </span>
            </span>
          </p>

          <p className="mt-5 text-sm text-text">
            {t("billing.currentPlan.usageLabel")}
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
            onClick={() => navigate("/", { state: { scrollTo: "pricing" } })}
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

        <div className="border-t border-line p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-brand">
                {t("billing.cancelSubscription.label")}
              </p>
              <p className="text-sm text-text-secondary mt-0.5">
                {t("billing.cancelSubscription.description")}
              </p>
            </div>
            {!confirmingCancel && !cancelled && (
              <Button
                size="compact"
                variant="destructive"
                className="shrink-0"
                onClick={() => setConfirmingCancel(true)}
              >
                {t("billing.cancelSubscription.cancel")}
              </Button>
            )}
          </div>

          <AnimatePresence initial={false}>
            {cancelled && (
              <motion.p
                key="cancelled"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden mt-4 pt-4 border-t border-line flex items-center gap-1.5 text-sm text-success"
              >
                <CheckCircle2 size={15} strokeWidth={2} className="shrink-0" />
                {t("billing.cancelSubscription.cancelled")}
              </motion.p>
            )}

            {confirmingCancel && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-line space-y-3">
                  <p className="text-sm text-text-secondary">
                    {t("billing.cancelSubscription.confirm")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="compact"
                      variant="destructive"
                      disabled={cancelling}
                      onClick={handleCancelSubscription}
                    >
                      {cancelling && (
                        <Loader2 size={15} className="animate-spin" />
                      )}
                      {cancelling
                        ? t("billing.cancelSubscription.cancelling")
                        : t("billing.cancelSubscription.confirmYes")}
                    </Button>
                    <Button
                      size="compact"
                      variant="outline"
                      disabled={cancelling}
                      onClick={() => setConfirmingCancel(false)}
                    >
                      {t("billing.cancelSubscription.confirmCancel")}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
