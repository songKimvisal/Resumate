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
import { getAiCredits, grantAiCredits } from "../../lib/api/credits";
import { getPdfSaves, grantPdfSaves } from "../../lib/api/pdfs";
import { getJobAnalyses, grantJobAnalyses } from "../../lib/api/analyses";
import {
  applyTemplateEntitlements,
  getTemplateEntitlements,
  grantTemplatePack,
  purchasePremiumTemplate,
  unlockCustomization,
  unlockPremiumTemplate,
} from "../../lib/api/templates";
import { recordPayment } from "../../lib/api/payments";
import { BackendError } from "../../lib/api/client";
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
const KHQR_MIN_CHECK_GAP_MS = 10000;
const KHQR_MIN_AWAY_MS = 5000;
// Most shoppers pay within the first minute, so the checks bunch up there.
const KHQR_AUTO_CHECK_AFTER_MS = [15000, 30000, 50000, 90000, 180000];
const KHQR_TAP_COOLDOWN_SECONDS = 10;
const KHQR_MAX_TAPS = 4;
const KHQR_FULFIL_RETRIES = 4;
const KHQR_FULFIL_RETRY_MS = 2000;
const KHQR_SLOW_HINT_MS = 4000;
const KHQR_COLD_START_RETRY_MS = 1500;
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
            name: t(`marketplace.styleNames.${pendingTemplatePreset.styleKey}`),
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
  const [khqrErrorCode, setKhqrErrorCode] = useState<string | null>(null);
  const [khqrNotConfirmed, setKhqrNotConfirmed] = useState(false);
  const [khqrCheckUnavailable, setKhqrCheckUnavailable] = useState(false);
  const [khqrLimitReached, setKhqrLimitReached] = useState(false);
  const [khqrSlow, setKhqrSlow] = useState(false);
  const khqrSlowTimerRef = useRef<number | null>(null);
  const [khqrFulfilmentFailed, setKhqrFulfilmentFailed] = useState(false);
  const khqrFulfilledRef = useRef(false);
  const khqrLoadingRef = useRef<string | null>(null);
  // One check at a time, and never two for the same wake-up.
  const khqrCheckInFlightRef = useRef(false);
  const khqrLastCheckAtRef = useRef(0);
  // When this tab lost the shopper's attention, or 0 while it still has it.
  const khqrAwaySinceRef = useRef(0);
  const [khqrTapsUsed, setKhqrTapsUsed] = useState(0);
  const [khqrCooldownSeconds, setKhqrCooldownSeconds] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [afterPay, setAfterPay] = useState<AfterPay>("dashboard");

  const [useNewCard, setUseNewCard] = useState(!savedCard);
  const card = useCardForm();
  const [savedCardCvc, setSavedCardCvc] = useState("");
  const [processing, setProcessing] = useState(false);

  const usingSavedCard =
    paymentMethod === "stripe" && !!savedCard && !useNewCard;
  const savedCardCvcValid =
    savedCardCvc.length >= 3 && savedCardCvc.length <= 4;

  const isStripeFormValid =
    (usingSavedCard && savedCardCvcValid) || card.isValid;

  const fulfillFlatPurchase = async (
    flat: FlatKind,
    alreadyGranted = false,
  ) => {
    if (!flatPlanData) return;
    const provider = paymentMethod === "khqr" ? "khqr" : "stripe";
    if (!alreadyGranted) {
      try {
        await recordPayment({
          packId: flatPlanData.id,
          packName: flatPlanData.name,
          provider,
        });
      } catch (err) {
        console.warn("Could not record payment:", err);
      }
    }

    if (flat === "customization") {
      try {
        if (alreadyGranted) {
          applyTemplateEntitlements(await getTemplateEntitlements());
        } else {
          await unlockCustomization();
        }
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
        if (alreadyGranted) {
          applyTemplateEntitlements(await getTemplateEntitlements());
        } else {
          await purchasePremiumTemplate(templateId);
        }
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
  const fulfillPackPurchase = async (
    packId: PackId,
    { alreadyGranted = false }: { alreadyGranted?: boolean } = {},
  ) => {
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
    if (!alreadyGranted) {
      recordPayment({
        packId,
        packName: planData.name,
        provider: paymentMethod === "khqr" ? "khqr" : "stripe",
      }).catch((err) => console.warn("Could not record payment:", err));
    }

    const claimTemplates = () =>
      pendingId && packIncludesTemplates(packId)
        ? unlockPremiumTemplate(pendingId)
        : getTemplateEntitlements().then((entitlements) => {
            applyTemplateEntitlements(entitlements);
            return entitlements;
          });

    const [pdfsResult, creditsResult, analysesResult, templatesResult] =
      await Promise.allSettled([
        alreadyGranted ? getPdfSaves() : grantPdfSaves(packId),
        alreadyGranted ? getAiCredits() : grantAiCredits(packId),
        alreadyGranted ? getJobAnalyses() : grantJobAnalyses(packId),
        alreadyGranted
          ? claimTemplates()
          : grantTemplatePack(packId, pendingId),
      ]);

    const verb = alreadyGranted ? "load" : "grant";

    if (pdfsResult.status === "fulfilled") {
      setPdfs(pdfsResult.value.total, pdfsResult.value.used);
    } else {
      console.warn(`Could not ${verb} PDF saves:`, pdfsResult.reason);
    }

    if (creditsResult.status === "fulfilled") {
      setCredits(creditsResult.value.total, creditsResult.value.used);
    } else {
      console.warn(`Could not ${verb} AI credits:`, creditsResult.reason);
    }

    if (analysesResult.status === "fulfilled") {
      setAnalyses(analysesResult.value.total, analysesResult.value.used);
    } else {
      console.warn(`Could not ${verb} job analyses:`, analysesResult.reason);
    }

    let unlockedCount = 0;
    let templateSlots = 0;
    if (templatesResult.status === "fulfilled") {
      unlockedCount = templatesResult.value.unlockedTemplateIds.length;
      templateSlots = templatesResult.value.templateSlots;
    } else {
      console.warn(`Could not ${verb} templates:`, templatesResult.reason);
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

  const fulfillPurchase = async (alreadyGranted = false) => {
    if (checkout?.flat) {
      await fulfillFlatPurchase(checkout.flat, alreadyGranted);
      return;
    }
    if (planData && isPackId(planData.id)) {
      await fulfillPackPurchase(planData.id, { alreadyGranted });
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
  const loadKhqr = (force = false, isRetry = false) => {
    if (!planData) return;
    if (!force && khqrLoadingRef.current === planData.id) return;
    khqrLoadingRef.current = planData.id;
    khqrFulfilledRef.current = false;
    khqrCheckInFlightRef.current = false;
    khqrLastCheckAtRef.current = 0;
    khqrAwaySinceRef.current = 0;
    setKhqrTapsUsed(0);
    setKhqrCooldownSeconds(0);
    setKhqr(null);
    setKhqrLoadError(false);
    setKhqrErrorCode(null);
    setKhqrNotConfirmed(false);
    setKhqrCheckUnavailable(false);
    setKhqrLimitReached(false);
    setKhqrFulfilmentFailed(false);
    setSecondsLeft(QR_EXPIRY_SECONDS);

    setKhqrSlow(false);
    if (khqrSlowTimerRef.current) window.clearTimeout(khqrSlowTimerRef.current);
    khqrSlowTimerRef.current = window.setTimeout(
      () => setKhqrSlow(true),
      KHQR_SLOW_HINT_MS,
    );
    const stopWaiting = () => {
      if (khqrSlowTimerRef.current) {
        window.clearTimeout(khqrSlowTimerRef.current);
        khqrSlowTimerRef.current = null;
      }
      setKhqrSlow(false);
    };

    createKhqrPayment({
      packId: planData.id,
      packName: planData.name,
    })
      .then((res) => {
        stopWaiting();
        setKhqr({
          qrString: res.qr_string,
          md5: res.md5,
          createdAt: Date.now() / 1000,
        });
        setSecondsLeft(QR_EXPIRY_SECONDS);
      })
      .catch((err) => {
        const status = err instanceof BackendError ? err.status : 0;

        if (status === 0 && !isRetry) {
          window.setTimeout(
            () => loadKhqr(true, true),
            KHQR_COLD_START_RETRY_MS,
          );
          return;
        }
        stopWaiting();
        const detail =
          err instanceof BackendError ? JSON.stringify(err.body) : String(err);
        const why =
          status === 429
            ? "Bakong's daily request limit is used up - no QR was minted"
            : status === 503
              ? "the server has no BAKONG_TOKEN / BAKONG_ACCOUNT_ID configured"
              : status === 400
                ? "the server does not sell this SKU"
                : status === 422
                  ? "the backend is older than this frontend - redeploy it"
                  : status === 401
                    ? "the session token was rejected"
                    : status === 0
                      ? "the backend could not be reached (URL or CORS)"
                      : `HTTP ${status}`;
        console.warn(
          `KHQR code could not be created for "${planData.id}": ${why}`,
          detail,
        );
        setKhqrLimitReached(status === 429);
        setKhqrErrorCode(status === 0 ? "no connection" : `HTTP ${status}`);
        setKhqrLoadError(true);
        khqrLoadingRef.current = null;
      });
  };

  useEffect(() => {
    if (!planData || paymentMethod !== "khqr") return;
    loadKhqr();
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      setKhqrCooldownSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(interval);
      if (khqrSlowTimerRef.current) {
        window.clearTimeout(khqrSlowTimerRef.current);
        khqrSlowTimerRef.current = null;
      }
    };
    // planData is a new object every render, don't retrigger on it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, planData?.id]);

  const checkKhqrPaid = async (md5: string, createdAt: number) => {
    const first = await getKhqrStatus(md5, createdAt);
    if (first.status !== "paid") return { paid: false, granted: false };
    if (first.fulfilled === true) return { paid: true, granted: true };

    for (let attempt = 0; attempt < KHQR_FULFIL_RETRIES; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, KHQR_FULFIL_RETRY_MS));
      const again = await getKhqrStatus(md5, createdAt);
      if (again.fulfilled === true) return { paid: true, granted: true };
    }
    return { paid: true, granted: false };
  };
  const runKhqrCheck = async (
    reason: "return" | "auto" | "manual",
  ): Promise<void> => {
    if (!khqr || khqrFulfilledRef.current) return;
    if (khqrCheckInFlightRef.current) return;
    if (
      reason !== "manual" &&
      Date.now() - khqrLastCheckAtRef.current < KHQR_MIN_CHECK_GAP_MS
    ) {
      return;
    }
    khqrCheckInFlightRef.current = true;
    khqrLastCheckAtRef.current = Date.now();
    try {
      const { paid, granted } = await checkKhqrPaid(khqr.md5, khqr.createdAt);
      setKhqrCheckUnavailable(false);
      setKhqrLimitReached(false);
      if (paid && granted) {
        khqrFulfilledRef.current = true;
        setKhqrFulfilmentFailed(false);
        void fulfillPurchase(true);
        return;
      }
      if (paid) {
        setKhqrFulfilmentFailed(true);
        return;
      }
      if (reason === "manual") setKhqrNotConfirmed(true);
    } finally {
      khqrCheckInFlightRef.current = false;
    }
  };
  useEffect(() => {
    if (!khqr || secondsLeft <= 0) return;

    const check = (reason: "return" | "auto") => {
      runKhqrCheck(reason).catch((err) => {
        console.warn("KHQR status check failed:", err);
        const status = err instanceof BackendError ? err.status : 0;
        setKhqrLimitReached(status === 429);
        setKhqrCheckUnavailable(status === 502 || status === 503);
      });
    };
    const markAway = () => {
      if (khqrAwaySinceRef.current === 0) {
        khqrAwaySinceRef.current = Date.now();
      }
    };
    const checkOnReturn = () => {
      if (document.visibilityState !== "visible") return;
      const awaySince = khqrAwaySinceRef.current;
      khqrAwaySinceRef.current = 0;
      if (awaySince === 0 || Date.now() - awaySince < KHQR_MIN_AWAY_MS) return;
      check("return");
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") markAway();
      else checkOnReturn();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", markAway);
    window.addEventListener("focus", checkOnReturn);

    const elapsed = Date.now() - khqr.createdAt * 1000;
    const autoChecks = KHQR_AUTO_CHECK_AFTER_MS.filter((at) => at > elapsed).map(
      (at) =>
        window.setTimeout(() => {
          if (document.visibilityState === "visible") check("auto");
        }, at - elapsed),
    );
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", markAway);
      window.removeEventListener("focus", checkOnReturn);
      autoChecks.forEach((id) => window.clearTimeout(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khqr, secondsLeft > 0]);

  if (!planData) return null;

  const khqrTapsLeft = KHQR_MAX_TAPS - khqrTapsUsed;

  const handleConfirmKhqr = () => {
    if (verifyingKhqr || secondsLeft <= 0 || !khqr) return;
    if (khqrCooldownSeconds > 0 || khqrTapsLeft <= 0) return;
    setKhqrTapsUsed((n) => n + 1);
    setKhqrCooldownSeconds(KHQR_TAP_COOLDOWN_SECONDS);
    setVerifyingKhqr(true);
    setKhqrNotConfirmed(false);
    setKhqrCheckUnavailable(false);
    setKhqrLimitReached(false);
    setKhqrFulfilmentFailed(false);
    runKhqrCheck("manual")
      .catch((err) => {
        console.warn("Could not check KHQR status:", err);
        const status = err instanceof BackendError ? err.status : 0;
        if (status === 429) setKhqrLimitReached(true);
        else if (status === 502 || status === 503)
          setKhqrCheckUnavailable(true);
        else setKhqrNotConfirmed(true);
      })
      .finally(() => setVerifyingKhqr(false));
  };

  const regenerateKhqrCode = () => loadKhqr(true);

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
                  <div className="max-w-60 px-4 text-center">
                    <p className="text-xs text-destructive">
                      {khqrLimitReached
                        ? t("billing.payment.khqr.limitReached")
                        : t("billing.payment.khqr.unavailable")}
                    </p>
                    {khqrErrorCode && !khqrLimitReached ? (
                      <p className="mt-1 font-mono text-[10px] text-text-secondary">
                        {khqrErrorCode}
                      </p>
                    ) : null}
                  </div>
                ) : khqr ? (
                  <QRCodeSVG value={khqr.qrString} size={180} />
                ) : (
                  <div className="flex max-w-60 flex-col items-center gap-2 px-4 text-center">
                    <Loader2
                      size={24}
                      className="animate-spin text-text-secondary"
                    />
                    {khqrSlow ? (
                      <p className="text-xs text-text-secondary">
                        {t("billing.payment.khqr.warmingUp")}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {!khqr ? null : secondsLeft > 0 ? (
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

            {khqr ? (
              <p className="text-center text-xs text-text-secondary mt-3 px-5">
                {t("billing.payment.khqr.instructions")}
              </p>
            ) : null}

            <div className="px-5 pb-5">
              {!khqrLoadError && secondsLeft > 0 ? (
                <Button
                  className="mt-3 h-10 w-full"
                  size="compact"
                  disabled={
                    verifyingKhqr ||
                    !khqr ||
                    khqrCooldownSeconds > 0 ||
                    khqrTapsLeft <= 0
                  }
                  onClick={handleConfirmKhqr}
                >
                  {verifyingKhqr ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      {t("billing.payment.khqr.verifying")}
                    </>
                  ) : khqrTapsLeft <= 0 ? (
                    t("billing.payment.khqr.autoChecking")
                  ) : khqrCooldownSeconds > 0 ? (
                    t("billing.payment.khqr.checkAgainIn", {
                      seconds: khqrCooldownSeconds,
                    })
                  ) : (
                    t("billing.payment.khqr.confirmCta")
                  )}
                </Button>
              ) : null}
              {khqrNotConfirmed && (
                <p className="mt-2 text-center text-xs text-destructive">
                  {t("billing.payment.khqr.notConfirmed")}
                </p>
              )}
              {khqrLimitReached && !khqrLoadError && (
                <p className="mt-2 text-center text-xs text-destructive">
                  {t("billing.payment.khqr.limitReachedPaid")}
                </p>
              )}
              {khqrCheckUnavailable && (
                <p className="mt-2 text-center text-xs text-destructive">
                  {t("billing.payment.khqr.checkUnavailable")}
                </p>
              )}
              {khqrFulfilmentFailed && (
                <p className="mt-2 text-center text-xs text-destructive">
                  {t("billing.payment.khqr.fulfilmentFailed")}
                </p>
              )}
              {(khqrLoadError || secondsLeft <= 0) && !khqrLimitReached ? (
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
