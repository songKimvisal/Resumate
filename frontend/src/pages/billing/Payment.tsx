import { useEffect, useRef, useState } from "react";
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
import { usePacks } from "../../hooks/usePacks";
import { useCardForm } from "../../hooks/useCardForm";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import { usePaymentMethodStore } from "../../store/paymentMethodStore";
import { grantAiCredits } from "../../lib/api/credits";
import { grantPdfSaves } from "../../lib/api/pdfs";
import { grantJobAnalyses } from "../../lib/api/analyses";
import {
  grantTemplatePack,
  purchasePremiumTemplate,
  unlockCustomization,
} from "../../lib/api/templates";
import { recordPayment } from "../../lib/api/payments";
import { createKhqrPayment, getKhqrStatus } from "../../lib/api/khqr";
import {
  consumePendingTemplateAsNewResume,
  consumePendingTemplateId,
  peekPendingTemplateId,
} from "../../lib/session";
import { applyMarketplaceTemplate } from "../../lib/applyMarketplaceTemplate";
import {
  CUSTOMIZATION_UNLOCK_PRICE,
  PREMIUM_TEMPLATE_PRICE,
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
// Used for the very first check and as a fallback after a failed request -
// every check after that uses the delay Bakong itself recommends.
const KHQR_POLL_FALLBACK_SECONDS = 5;
const MOCK_STRIPE_PROCESSING_MS = 500;

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

  type FlatKind = "customization" | "premium-template";
  const checkout = location.state as
    | { pack?: PackId; plan?: PlanId; flat?: undefined }
    | { flat: FlatKind; pack?: undefined; plan?: undefined }
    | null;
  const { all: packs } = usePacks();
  const packPlanData =
    (isPackId(checkout?.pack)
      ? packs.find((p) => p.id === checkout.pack)
      : undefined) ??
    (checkout?.plan === "pro"
      ? packs.find((p) => p.id === "both-everything")
      : checkout?.plan === "starter"
        ? packs.find((p) => p.id === "both-starter")
        : undefined);
  const [pendingTemplateId] = useState(() => peekPendingTemplateId());
  const pendingTemplatePreset = pendingTemplateId
    ? TEMPLATE_PRESETS.find((p) => p.id === pendingTemplateId)
    : undefined;
  const flatPlanData =
    checkout?.flat === "customization"
      ? {
          id: "customization-unlock",
          name: t("builder.customizePage.customizationUnlock.title"),
          price: CUSTOMIZATION_UNLOCK_PRICE,
          cta: t("builder.customizePage.customizationUnlock.cta", {
            price: CUSTOMIZATION_UNLOCK_PRICE,
          }),
        }
      : checkout?.flat === "premium-template" && pendingTemplatePreset
        ? {
            id: `template:${pendingTemplatePreset.id}`,
            name: t(
              `marketplace.styleNames.${pendingTemplatePreset.styleKey}`,
            ),
            price: PREMIUM_TEMPLATE_PRICE,
            cta: t("marketplace.unlockModal.buyTemplateCta", {
              price: PREMIUM_TEMPLATE_PRICE,
            }),
          }
        : undefined;

  const planData = packPlanData ?? flatPlanData;

  useEffect(() => {
    if (!planData) navigate("/billing", { replace: true });
  }, [planData, navigate]);

  const savedCard = usePaymentMethodStore((s) => s.savedCard);
  const preferredMethod = usePaymentMethodStore((s) => s.preferredMethod);
  const saveCardToStore = usePaymentMethodStore((s) => s.saveCard);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentProvider>(preferredMethod);
  const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRY_SECONDS);
  const [verifyingKhqr, setVerifyingKhqr] = useState(false);
  const [khqr, setKhqr] = useState<{
    qrString: string;
    md5: string;
    createdAt: number;
  } | null>(null);
  const [khqrLoadError, setKhqrLoadError] = useState(false);
  const [khqrNotConfirmed, setKhqrNotConfirmed] = useState(false);
  const khqrFulfilledRef = useRef(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [afterPay, setAfterPay] = useState<AfterPay>("dashboard");

  const [useNewCard, setUseNewCard] = useState(!savedCard);
  const card = useCardForm();
  const [savedCardCvc, setSavedCardCvc] = useState("");
  const [processing, setProcessing] = useState(false);

  const usingSavedCard = paymentMethod === "stripe" && !!savedCard && !useNewCard;
  const savedCardCvcValid = savedCardCvc.length >= 3 && savedCardCvc.length <= 4;

  const isStripeFormValid =
    (usingSavedCard && savedCardCvcValid) || card.isValid;

  const fulfillFlatPurchase = async (flat: FlatKind) => {
    if (!flatPlanData) return;
    const provider = paymentMethod === "khqr" ? "khqr" : "stripe";
    const amountCents = Math.round(parseFloat(flatPlanData.price) * 100);

    try {
      await recordPayment({
        packId: flatPlanData.id,
        packName: flatPlanData.name,
        provider,
        amountCents,
      });
    } catch (err) {
      console.warn("Could not record payment:", err);
    }

    if (flat === "customization") {
      try {
        await unlockCustomization();
      } catch (err) {
        console.warn("Could not unlock customization:", err);
      }
      setAfterPay("builder");
      setShowSuccess(true);
      return;
    }

    const templateId = consumePendingTemplateId();
    const asNewResume = consumePendingTemplateAsNewResume();
    const preset = templateId
      ? TEMPLATE_PRESETS.find((p) => p.id === templateId)
      : undefined;
    if (templateId) {
      try {
        await purchasePremiumTemplate(templateId);
      } catch (err) {
        console.warn("Could not purchase template:", err);
      }
    }
    setAfterPay("builder");
    if (preset) {
      await applyMarketplaceTemplate({
        customization: preset.customization,
        templateId: preset.id,
        title: t(`marketplace.styleNames.${preset.styleKey}`),
        asNewResume,
      }).catch((err) => console.warn("Could not apply template:", err));
    }
    setShowSuccess(true);
  };

  const fulfillPackPurchase = async (packId: PackId) => {
    if (!planData) return;
    subscribeToPlan(packToPlanId(packId), packId);

    const pendingId = consumePendingTemplateId();
    const pendingAsNewResume = consumePendingTemplateAsNewResume();
    const pendingPreset = pendingId
      ? TEMPLATE_PRESETS.find((p) => p.id === pendingId)
      : undefined;
    const shouldApplyPending =
      Boolean(pendingPreset) &&
      (packUnlocksAllTemplates(packId) || packIncludesTemplates(packId));
    const [pdfsResult, creditsResult, analysesResult, templatesResult] =
      await Promise.allSettled([
        grantPdfSaves(packId),
        grantAiCredits(packId),
        grantJobAnalyses(packId),
        grantTemplatePack(packId, pendingId),
        recordPayment({
          packId,
          packName: planData.name,
          provider: paymentMethod === "khqr" ? "khqr" : "stripe",
          amountCents: Math.round(parseFloat(planData.price) * 100),
        }),
      ]);

    if (pdfsResult.status === "fulfilled") {
      setPdfs(pdfsResult.value.total, pdfsResult.value.used);
    } else {
      console.warn("Could not grant PDF saves:", pdfsResult.reason);
    }

    if (creditsResult.status === "fulfilled") {
      setCredits(creditsResult.value.total, creditsResult.value.used);
    } else {
      console.warn("Could not grant AI credits:", creditsResult.reason);
    }

    if (analysesResult.status === "fulfilled") {
      setAnalyses(analysesResult.value.total, analysesResult.value.used);
    } else {
      console.warn("Could not grant job analyses:", analysesResult.reason);
    }

    let unlockedCount = 0;
    let templateSlots = 0;
    if (templatesResult.status === "fulfilled") {
      unlockedCount = templatesResult.value.unlockedTemplateIds.length;
      templateSlots = templatesResult.value.templateSlots;
    } else {
      console.warn("Could not grant templates:", templatesResult.reason);
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
        asNewResume: pendingAsNewResume,
      }).finally(showSuccess);
      return;
    }
    showSuccess();
  };

  const fulfillPurchase = async () => {
    if (checkout?.flat) {
      await fulfillFlatPurchase(checkout.flat);
      return;
    }
    if (planData && isPackId(planData.id)) {
      await fulfillPackPurchase(planData.id);
    }
  };

  const continueAfterPay = (next: AfterPay) => {
    if (next === "pick") {
      navigate("/marketplace", {
        replace: true,
        state: { pickTemplates: true },
      });
      return;
    }
    if (next === "browse") {
      navigate("/marketplace", { replace: true });
      return;
    }
    navigate(next === "builder" ? "/builder" : "/dashboard", { replace: true });
  };
  // Asks the backend for a real, scannable Bakong KHQR code for this
  // purchase's amount. Called on mount/method switch and again whenever the
  // shopper asks for a fresh code after the old one expires.
  const loadKhqr = () => {
    if (!planData) return;
    khqrFulfilledRef.current = false;
    setKhqr(null);
    setKhqrLoadError(false);
    setKhqrNotConfirmed(false);
    setSecondsLeft(QR_EXPIRY_SECONDS);
    createKhqrPayment({
      packId: planData.id,
      packName: planData.name,
      amountCents: Math.round(parseFloat(planData.price) * 100),
    })
      .then((res) =>
        setKhqr({
          qrString: res.qr_string,
          md5: res.md5,
          createdAt: Date.now() / 1000,
        }),
      )
      .catch((err) => {
        console.warn("Could not create KHQR payment:", err);
        setKhqrLoadError(true);
      });
  };

  useEffect(() => {
    if (!planData || paymentMethod !== "khqr") return;
    loadKhqr();
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
    // planData is recreated on every render (usePacks() builds fresh pack
    // objects each call), so depending on it directly would re-trigger this
    // effect - and re-request a brand-new QR - on every countdown tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, planData?.id]);

  // Asks Bakong (via our backend) whether this QR's code was actually paid.
  // Reports paid=true only the first time it sees "paid", so a slow poll and
  // the manual "I've completed the payment" click can't both trigger
  // fulfillment. nextDelaySeconds comes from Bakong's own dynamic delay
  // matrix (short checks early, widening the longer a code sits unpaid).
  const checkKhqrPaid = async (md5: string, createdAt: number) => {
    if (khqrFulfilledRef.current) {
      return { paid: false, nextDelaySeconds: KHQR_POLL_FALLBACK_SECONDS };
    }
    const { status, next_delay_seconds } = await getKhqrStatus(md5, createdAt);
    const paid = status === "paid" && !khqrFulfilledRef.current;
    if (paid) khqrFulfilledRef.current = true;
    return { paid, nextDelaySeconds: next_delay_seconds };
  };

  // Background poll: a self-rescheduling chain rather than a fixed interval,
  // so it can honor Bakong's recommended delay instead of hammering the API
  // at a flat rate for however long the shopper leaves the QR open.
  useEffect(() => {
    if (!khqr || secondsLeft <= 0) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = () => {
      checkKhqrPaid(khqr.md5, khqr.createdAt)
        .then(({ paid, nextDelaySeconds }) => {
          if (cancelled) return;
          if (paid) {
            void fulfillPurchase();
            return;
          }
          timeoutId = setTimeout(poll, nextDelaySeconds * 1000);
        })
        .catch((err) => {
          console.warn("KHQR status check failed:", err);
          if (!cancelled) {
            timeoutId = setTimeout(poll, KHQR_POLL_FALLBACK_SECONDS * 1000);
          }
        });
    };

    timeoutId = setTimeout(poll, KHQR_POLL_FALLBACK_SECONDS * 1000);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // Depending on (secondsLeft > 0) rather than secondsLeft itself avoids
    // tearing the poll chain down every second (it ticks independently).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khqr, secondsLeft > 0]);

  if (!planData) return null;

  // Manual "I've completed the payment" check - an immediate poll on top of
  // the background one above, for shoppers who don't want to wait it out.
  const handleConfirmKhqr = () => {
    if (verifyingKhqr || secondsLeft <= 0 || !khqr) return;
    setVerifyingKhqr(true);
    setKhqrNotConfirmed(false);
    checkKhqrPaid(khqr.md5, khqr.createdAt)
      .then(({ paid }) => {
        if (paid) {
          void fulfillPurchase();
        } else {
          setKhqrNotConfirmed(true);
        }
      })
      .catch((err) => {
        console.warn("Could not check KHQR status:", err);
        setKhqrNotConfirmed(true);
      })
      .finally(() => setVerifyingKhqr(false));
  };

  // Bakong's automatic check can be unreliable during testing (e.g. a
  // developer token's daily rate limit) even when the transfer itself went
  // through. This lets the shopper vouch for their own completed payment
  // and unlock immediately rather than being stuck behind a failed check.
  const handleForceUnlock = () => {
    khqrFulfilledRef.current = true;
    setKhqrNotConfirmed(false);
    void fulfillPurchase();
  };

  const regenerateKhqrCode = () => loadKhqr();

  const handlePay = () => {
    if (!isStripeFormValid || processing) return;
    setProcessing(true);
    setTimeout(() => {
      void fulfillPurchase()
        .then(() => {
          if (!usingSavedCard) {
            saveCardToStore(card.toSavedCard());
          }
        })
        .finally(() => setProcessing(false));
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
                <div className="mt-4 rounded-xl border border-line p-4">
                  {savedCard && !useNewCard ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <CreditCard
                          size={20}
                          className="shrink-0 text-text-secondary"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-text">
                            {savedCard.brand} •••• {savedCard.last4}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {t("billing.paymentMethod.card.expires", {
                              expiry: savedCard.expiry,
                            })}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            card.reset();
                            setUseNewCard(true);
                          }}
                          className="shrink-0 text-sm font-medium text-brand hover:underline"
                        >
                          {t("billing.paymentMethod.card.replace")}
                        </button>
                      </div>
                      <Input
                        id="cc-saved-csc"
                        name="cvc"
                        type="password"
                        autoComplete="cc-csc"
                        label={t("billing.paymentMethod.card.cvcLabel")}
                        placeholder="123"
                        inputMode="numeric"
                        className="max-w-28"
                        value={savedCardCvc}
                        onChange={(e) =>
                          setSavedCardCvc(
                            e.target.value.replace(/\D/g, "").slice(0, 4),
                          )
                        }
                      />
                      <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Lock size={12} strokeWidth={2} />
                        {t("billing.paymentMethod.card.reverifyNote")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Input
                        id="cc-name"
                        name="ccname"
                        autoComplete="cc-name"
                        label={t("billing.paymentMethod.card.nameLabel")}
                        placeholder={t(
                          "billing.paymentMethod.card.namePlaceholder",
                        )}
                        value={card.cardName}
                        onChange={(e) => card.setCardName(e.target.value)}
                        onBlur={() => card.touch("name")}
                        error={card.errors.name}
                      />
                      <Input
                        id="cc-number"
                        name="cardnumber"
                        autoComplete="cc-number"
                        label={t("billing.paymentMethod.card.numberLabel")}
                        placeholder="4242 4242 4242 4242"
                        inputMode="numeric"
                        value={card.cardNumber}
                        onChange={(e) => card.setCardNumber(e.target.value)}
                        onBlur={() => card.touch("number")}
                        error={card.errors.number}
                        trailing={
                          card.brand !== "Card" ? card.brand : undefined
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
                          value={card.cardExpiry}
                          onChange={(e) => card.setCardExpiry(e.target.value)}
                          onBlur={() => card.touch("expiry")}
                          error={card.errors.expiry}
                          className="flex-1"
                        />
                        <Input
                          id="cc-csc"
                          name="cvc"
                          type="password"
                          autoComplete="cc-csc"
                          label={t("billing.paymentMethod.card.cvcLabel")}
                          placeholder="123"
                          inputMode="numeric"
                          value={card.cardCvc}
                          onChange={(e) => card.setCardCvc(e.target.value)}
                          onBlur={() => card.touch("cvc")}
                          error={card.errors.cvc}
                          className="flex-1"
                        />
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Lock size={12} strokeWidth={2} />
                        {t("billing.paymentMethod.card.secureNote")}
                      </p>
                      {savedCard && (
                        <button
                          type="button"
                          onClick={() => setUseNewCard(false)}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          {t("billing.paymentMethod.card.useSaved", {
                            brand: savedCard.brand,
                            last4: savedCard.last4,
                          })}
                        </button>
                      )}
                    </div>
                  )}
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
              <div
                className="flex items-center justify-center pb-5"
                style={{ minHeight: 180 }}
              >
                {khqrLoadError ? (
                  <p className="max-w-45 text-center text-xs text-destructive">
                    {t("billing.payment.khqr.unavailable")}
                  </p>
                ) : khqr ? (
                  <QRCodeSVG value={khqr.qrString} size={180} />
                ) : (
                  <Loader2 size={24} className="animate-spin text-text-secondary" />
                )}
              </div>
            </div>

            {secondsLeft > 0 ? (
              <p className="flex items-center justify-center gap-1.5 text-sm mt-4">
                <Timer size={15} className="text-text-secondary" />
                <span className="text-text-secondary">
                  {t("billing.payment.khqr.expiresIn")}
                </span>
                <span className="font-semibold text-brand">
                  {formatCountdown(secondsLeft)}
                </span>
              </p>
            ) : (
              <p className="flex items-center justify-center gap-1.5 text-sm mt-4 text-destructive">
                <Timer size={15} />
                <span>{t("billing.payment.khqr.expired")}</span>
              </p>
            )}

            <p className="text-center text-xs text-text-secondary mt-3 px-5">
              {t("billing.payment.khqr.instructions")}
            </p>

            <div className="px-5 pb-5">
              {khqrLoadError ? (
                <Button
                  className="mt-3 h-9 w-full"
                  size="compact"
                  variant="outline"
                  onClick={regenerateKhqrCode}
                >
                  {t("billing.payment.khqr.regenerate")}
                </Button>
              ) : secondsLeft > 0 ? (
                <Button
                  className="mt-3 h-9 w-full"
                  size="compact"
                  disabled={verifyingKhqr || !khqr}
                  onClick={handleConfirmKhqr}
                >
                  {verifyingKhqr ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      {t("billing.payment.khqr.verifying")}
                    </>
                  ) : (
                    t("billing.payment.khqr.confirmCta")
                  )}
                </Button>
              ) : null}
              {khqrNotConfirmed && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-destructive">
                    {t("billing.payment.khqr.notConfirmed")}
                  </p>
                  <button
                    type="button"
                    onClick={handleForceUnlock}
                    className="mt-1.5 text-xs font-medium text-brand hover:underline"
                  >
                    {t("billing.payment.khqr.forceUnlock")}
                  </button>
                </div>
              )}
              {khqrLoadError || secondsLeft <= 0 ? (
                <Button
                  className="mt-3 h-9 w-full"
                  size="compact"
                  variant="outline"
                  onClick={regenerateKhqrCode}
                >
                  {t("billing.payment.khqr.regenerate")}
                </Button>
              ) : null}
              <p className="text-center text-xs text-text-secondary mt-3">
                {t("billing.payment.khqr.poweredBy")}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-line p-5 sm:p-6">
            <p className="font-bold text-brand text-center">
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
