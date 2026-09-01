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
import { usePacks } from "../../hooks/usePacks";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import { grantAiCredits } from "../../lib/api/credits";
import { grantPdfSaves } from "../../lib/api/pdfs";
import { grantJobAnalyses } from "../../lib/api/analyses";
import { grantTemplatePack } from "../../lib/api/templates";
import { consumePendingTemplateId } from "../../lib/session";
import { applyMarketplaceTemplate } from "../../lib/applyMarketplaceTemplate";
import {
  packIncludesTemplates,
  packUnlocksAllTemplates,
  remainingTemplateSlots,
} from "../../lib/templateAccess";
import { TEMPLATE_PRESETS } from "../../data/templates";
import {
  packToPlanId,
  isPackId,
  type PackId,
  type PaymentProvider,
  type PlanId,
} from "../../types/billing";
import PaymentSuccessModal, { type AfterPay } from "./PaymentSuccessModal";

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
  const setCredits = useSubscriptionStore((s) => s.setCredits);
  const setPdfs = useSubscriptionStore((s) => s.setPdfs);
  const setAnalyses = useSubscriptionStore((s) => s.setAnalyses);

  const checkout = location.state as
    | { pack?: PackId; plan?: PlanId }
    | null;
  const { all: packs } = usePacks();
  const planData =
    (isPackId(checkout?.pack)
      ? packs.find((p) => p.id === checkout.pack)
      : undefined) ??
    (checkout?.plan === "pro"
      ? packs.find((p) => p.id === "both-everything")
      : checkout?.plan === "starter"
        ? packs.find((p) => p.id === "both-starter")
        : undefined);

  useEffect(() => {
    if (!planData) navigate("/billing", { replace: true });
  }, [planData, navigate]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider>("khqr");
  const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRY_SECONDS);
  const [showSuccess, setShowSuccess] = useState(false);
  const [afterPay, setAfterPay] = useState<AfterPay>("dashboard");

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

  const fulfillPurchase = async (packId: PackId) => {
    subscribeToPlan(packToPlanId(packId), packId);
    try {
      const pdfs = await grantPdfSaves(packId);
      setPdfs(pdfs.total, pdfs.used);
    } catch (err) {
      console.warn("Could not grant PDF saves:", err);
    }
    try {
      const credits = await grantAiCredits(packId);
      setCredits(credits.total, credits.used);
    } catch (err) {
      console.warn("Could not grant AI credits:", err);
    }
    try {
      const analyses = await grantJobAnalyses(packId);
      setAnalyses(analyses.total, analyses.used);
    } catch (err) {
      console.warn("Could not grant job analyses:", err);
    }
    const pendingId = consumePendingTemplateId();
    const pendingPreset = pendingId
      ? TEMPLATE_PRESETS.find((p) => p.id === pendingId)
      : undefined;
    const shouldApplyPending =
      Boolean(pendingPreset) &&
      (packUnlocksAllTemplates(packId) || packIncludesTemplates(packId));

    let unlockedCount = 0;
    let templateSlots = 0;
    try {
      const entitlements = await grantTemplatePack(packId, pendingId);
      unlockedCount = entitlements.unlockedTemplateIds.length;
      templateSlots = entitlements.templateSlots;
    } catch (err) {
      console.warn("Could not grant templates:", err);
    }

    if (packUnlocksAllTemplates(packId)) {
      setAfterPay(pendingPreset ? "builder" : "browse");
    } else if (packIncludesTemplates(packId)) {
      const remaining = remainingTemplateSlots(templateSlots, unlockedCount);
      if (remaining > 0) setAfterPay("pick");
      else setAfterPay(pendingId ? "builder" : "dashboard");
    } else {
      setAfterPay("dashboard");
    }

    const showSuccess = () => setShowSuccess(true);
    if (shouldApplyPending && pendingPreset) {
      void applyMarketplaceTemplate({
        customization: pendingPreset.customization,
        templateId: pendingPreset.id,
        title: t(`marketplace.styleNames.${pendingPreset.styleKey}`),
      }).finally(showSuccess);
      return;
    }
    showSuccess();
  };

  const continueAfterPay = (next: AfterPay) => {
    if (next === "pick") {
      navigate("/marketplace", { replace: true, state: { pickTemplates: true } });
      return;
    }
    if (next === "browse") {
      navigate("/marketplace", { replace: true });
      return;
    }
    navigate(next === "builder" ? "/builder" : "/dashboard", { replace: true });
  };

  // KHQR: show a live countdown and simulate detecting the payment after a
  // short delay - there's no backend/webhook in this repo to poll yet.
  useEffect(() => {
    if (!planData || paymentMethod !== "khqr") return;

    setSecondsLeft(QR_EXPIRY_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    const successTimeout = setTimeout(() => {
      void fulfillPurchase(planData.id);
    }, MOCK_KHQR_SUCCESS_DELAY_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(successTimeout);
    };
    // fulfillPurchase is recreated each render; the timeout is reset with paymentMethod/planData.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, planData]);

  if (!planData) return null;

  const handlePay = () => {
    if (!isStripeFormValid || processing) return;
    setProcessing(true);
    setTimeout(() => {
      void fulfillPurchase(planData.id).finally(() => setProcessing(false));
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
      <Button size="compact" onClick={() => navigate(-1)}>
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
                    id="cc-name"
                    name="ccname"
                    autoComplete="cc-name"
                    label={t("billing.paymentMethod.card.nameLabel")}
                    placeholder={t(
                      "billing.paymentMethod.card.namePlaceholder",
                    )}
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                  <Input
                    id="cc-number"
                    name="cardnumber"
                    autoComplete="cc-number"
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
                      id="cc-exp"
                      name="cc-exp"
                      autoComplete="cc-exp"
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
                      id="cc-csc"
                      name="cvc"
                      autoComplete="cc-csc"
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
              <Button className="mt-4 h-9 w-full" size="compact" disabled>
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
              className="mt-5 h-9 w-full"
              size="compact"
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
        afterPay={afterPay}
        onContinue={() => continueAfterPay(afterPay)}
      />
    </div>
  );
}
