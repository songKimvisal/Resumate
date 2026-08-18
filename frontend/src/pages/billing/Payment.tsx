import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import {
  ChevronLeft,
  CreditCard,
  Loader2,
  Lock,
  QrCode,
  Timer,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../lib/utils";
import { formatCardNumber, formatExpiry } from "../../lib/cardFormat";
import { usePricingPlans } from "../../hooks/usePricingPlans";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import type { PaymentProvider, PlanId } from "../../types/billing";
import PaymentSuccessModal from "./PaymentSuccessModal";

const QR_EXPIRY_SECONDS = 5 * 60;
const MOCK_KHQR_SUCCESS_DELAY_MS = 5000;
const MOCK_STRIPE_PROCESSING_MS = 1500;

const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function Payment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const subscribeToPlan = useSubscriptionStore((s) => s.subscribeToPlan);

  const requestedPlan = (location.state as { plan?: PlanId } | null)?.plan;
  const plans = usePricingPlans();
  const planData = plans.find(
    (p) =>
      p.id === requestedPlan && (p.id === "starter" || p.id === "pro"),
  );

  useEffect(() => {
    if (!planData) navigate("/billing", { replace: true });
  }, [planData, navigate]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider>("khqr");
  const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRY_SECONDS);
  const [showSuccess, setShowSuccess] = useState(false);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [processing, setProcessing] = useState(false);

  const isStripeFormValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    /^\d{2}\/\d{2}$/.test(cardExpiry) &&
    cardCvc.length >= 3 &&
    cardName.trim().length > 0;

  // KHQR: show a live countdown and simulate detecting the payment after a
  // short delay — there's no backend/webhook in this repo to poll yet.
  useEffect(() => {
    if (!planData || paymentMethod !== "khqr") return;

    setSecondsLeft(QR_EXPIRY_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    const successTimeout = setTimeout(() => {
      subscribeToPlan(planData.id);
      setShowSuccess(true);
    }, MOCK_KHQR_SUCCESS_DELAY_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(successTimeout);
    };
  }, [paymentMethod, planData, subscribeToPlan]);

  if (!planData) return null;

  const handlePay = () => {
    if (!isStripeFormValid || processing) return;
    setProcessing(true);
    setTimeout(() => {
      subscribeToPlan(planData.id);
      setProcessing(false);
      setShowSuccess(true);
    }, MOCK_STRIPE_PROCESSING_MS);
  };

  const subscriptionHeader = (
    <p className="text-center font-semibold text-text">
      {t("billing.payment.title", { plan: planData.name })}{" "}
      <span className="text-brand italic">
        {t("billing.payment.titleAccent")}
      </span>
    </p>
  );

  return (
    <div className="min-h-screen bg-bg text-text px-4 sm:px-8 py-6">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} />
        {t("billing.payment.back")}
      </Button>

      <div className="mt-10 max-w-5xl mx-auto grid md:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="rounded-2xl border border-line p-5 sm:p-6">
          <p className="font-medium text-text">
            {t("billing.paymentMethod.label")}
          </p>
          <p className="text-sm text-text-secondary mt-0.5">
            {t("billing.paymentMethod.chooseSubtitle")}
          </p>

          <div className="mt-4 space-y-3">
            {(["khqr", "stripe"] as const).map((method) => {
              const Icon = method === "khqr" ? QrCode : CreditCard;
              const selected = paymentMethod === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
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
                      selected ? "border-brand bg-brand" : "border-line",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <AnimatePresence initial={false}>
            {paymentMethod === "stripe" && (
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
                        setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
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
        </div>

        {paymentMethod === "khqr" ? (
          <div className="rounded-2xl border border-line overflow-hidden">
            <div className="p-5 pb-0">{subscriptionHeader}</div>

            <div className="mx-5 mt-4 rounded-xl border border-line overflow-hidden">
              <div className="bg-brand text-white text-center py-2.5 font-bold tracking-wide">
                KHQR
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold uppercase text-text-secondary">
                  {t("billing.payment.khqr.merchantLabel")}
                </p>
                <p className="text-lg font-bold text-text">
                  {planData.price}{" "}
                  <span className="text-sm font-normal text-text-secondary">
                    USD
                  </span>
                </p>
              </div>
              <div className="flex justify-center pb-5">
                <QRCodeSVG
                  value={`KHQR|RESUMATE|${planData.id}|${planData.price}|USD`}
                  size={180}
                />
              </div>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-sm mt-4">
              <Timer size={15} className="text-text-secondary" />
              <span className="text-text-secondary">
                {t("billing.payment.khqr.expiresIn")}
              </span>
              <span className="font-semibold text-brand">
                {formatCountdown(secondsLeft)}
              </span>
            </p>

            <div className="px-5 pb-5">
              <Button className="mt-4 w-full" disabled>
                <Loader2 size={15} className="animate-spin" />
                {t("billing.payment.khqr.waitingForPayment")}
              </Button>
              <p className="text-center text-xs text-text-secondary mt-3">
                {t("billing.payment.khqr.poweredBy")}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-line p-5 sm:p-6">
            <p className="font-bold text-brand">
              {t("billing.payment.orderSummary.title")}
            </p>
            <div className="mt-3">{subscriptionHeader}</div>

            <div className="mt-4 space-y-2 text-sm border-t border-line pt-4">
              <div className="flex justify-between">
                <span className="text-text-secondary">
                  {t("billing.payment.orderSummary.subtotal")}
                </span>
                <span className="text-text">${planData.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">
                  {t("billing.payment.orderSummary.tax")}
                </span>
                <span className="text-text">$0</span>
              </div>
              <div className="flex justify-between font-bold border-t border-line pt-2 mt-2">
                <span className="text-text">
                  {t("billing.payment.orderSummary.dueToday")}
                </span>
                <span className="text-brand">${planData.price}</span>
              </div>
            </div>

            <Button
              className="mt-5 w-full"
              disabled={!isStripeFormValid || processing}
              onClick={handlePay}
            >
              {processing && <Loader2 size={15} className="animate-spin" />}
              {planData.cta}
            </Button>
            <p className="text-xs text-text-secondary text-center mt-3">
              {t("billing.payment.orderSummary.finePrint")}
            </p>
          </div>
        )}
      </div>

      <PaymentSuccessModal
        open={showSuccess}
        planName={planData.name}
        onGoToDashboard={() => navigate("/dashboard")}
      />
    </div>
  );
}
