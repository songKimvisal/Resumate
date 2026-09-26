import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, Lock, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import { usePaymentMethodStore } from "../../store/paymentMethodStore";
import { usePricingPlans } from "../../hooks/usePricingPlans";
import { usePacks } from "../../hooks/usePacks";
import { useSavedCards } from "../../hooks/useSavedCards";
import {
  CardBrandLogo,
  CardBrandLogos,
  PaymentMethodLogo,
} from "../../components/billing/CardBrands";
import { formatCardExpiry } from "../../lib/api/cards";
import UpgradePlanModal from "./UpgradePlanModal";
import PageTitle from "../../components/layout/PageTitle";

type PaymentMethod = "khqr" | "stripe";

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
    currentPack ?? pricingPlans.find((p) => p.id === plan) ?? pricingPlans[0];

  const paymentMethod = usePaymentMethodStore((s) => s.preferredMethod);
  const setPreferredMethod = usePaymentMethodStore((s) => s.setPreferredMethod);

  const [editingMethod, setEditingMethod] = useState(false);
  const [draftMethod, setDraftMethod] = useState<PaymentMethod>(paymentMethod);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeFailed, setRemoveFailed] = useState(false);
  const saved = useSavedCards();
  const savedCard = saved.cards[0];

  const openMethodEditor = () => {
    setDraftMethod(paymentMethod);
    setRemoveFailed(false);
    setEditingMethod(true);
  };

  const saveMethod = () => {
    setPreferredMethod(draftMethod);
    setEditingMethod(false);
  };

  const removeCard = (cardId: string) => {
    setRemovingId(cardId);
    setRemoveFailed(false);
    saved
      .removeCard(cardId)
      .catch((err) => {
        console.warn("Could not remove card:", err);
        setRemoveFailed(true);
      })
      .finally(() => setRemovingId(null));
  };

  const openUpgrade = () => setUpgradeModalOpen(true);

  const paymentMethodDisplay =
    paymentMethod === "khqr"
      ? t("billing.paymentMethod.khqr.name")
      : savedCard
        ? `${savedCard.brand} ••••\u00a0${savedCard.last4}`
        : t("billing.paymentMethod.stripe.name");

  const isFree = CURRENT_PLAN.price === "0";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageTitle text={t("billing.title")} accent={t("billing.titleAccent")} />
      <p className="mt-2 text-sm text-text-secondary">
        {t("billing.subtitle")}
      </p>

      <div className="mt-8 w-full max-w-2xl">
        <section className="overflow-hidden rounded-2xl border border-line bg-bg sm:rounded-[28px]">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 break-words text-xl font-extrabold tracking-tight text-text sm:text-2xl">
                {CURRENT_PLAN.name}
              </h2>
              <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                {t("billing.currentPlan.label")}
              </span>
            </div>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-[2rem] font-bold leading-none tracking-tight text-text">
                {isFree
                  ? t("billing.currentPlan.freePrice")
                  : `$${CURRENT_PLAN.price}`}
              </span>
              {!isFree && (
                <span className="text-sm text-text-secondary">
                  {t("billing.currentPlan.paidOnce")}
                </span>
              )}
            </p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {t("billing.currentPlan.heroNote")}
            </p>
            {CURRENT_PLAN.features.length > 0 && (
              <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
                {CURRENT_PLAN.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm leading-5 text-text"
                  >
                    <Check
                      className="mt-0.5 shrink-0 text-brand"
                      size={16}
                      strokeWidth={2.5}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            )}
            <Button
              size="compact"
              className="mt-5 h-9 w-full"
              onClick={openUpgrade}
            >
              {t("billing.currentPlan.upgradeCta")}
            </Button>
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-bg">
          <div className="p-4 sm:p-6">
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
                  <p className="mt-0.5 text-sm text-text-secondary">
                    {t("billing.paymentMethod.chooseSubtitle")}
                  </p>

                  <div className="mt-4 space-y-3">
                    {(["khqr", "stripe"] as const).map((method) => {
                      const selected = draftMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setDraftMethod(method)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                            selected
                              ? "border-brand"
                              : "border-line hover:border-brand/50",
                          )}
                        >
                          <PaymentMethodLogo method={method} />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-text">
                              {t(`billing.paymentMethod.${method}.name`)}
                            </span>
                            <span className="block text-sm text-text-secondary">
                              {t(`billing.paymentMethod.${method}.desc`)}
                            </span>
                            {method === "stripe" && (
                              <CardBrandLogos className="mt-2" />
                            )}
                          </span>
                          <span
                            className={cn(
                              "size-4 shrink-0 rounded-full border-2 transition-colors duration-200",
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
                        {!saved.loading &&
                        !saved.enabled &&
                        saved.cards.length === 0 ? (
                          <div className="mt-4 flex gap-2.5 rounded-xl border border-line p-4">
                            <Lock
                              size={16}
                              strokeWidth={2}
                              className="mt-0.5 shrink-0 text-text-secondary"
                            />
                            <p className="text-sm text-text-secondary">
                              {t("billing.payment.card.redirectNote")}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-xl border border-line p-4">
                            <p className="text-xs font-semibold uppercase text-text-secondary">
                              {t("billing.paymentMethod.card.savedTitle")}
                            </p>
                            {saved.loading ? (
                              <Loader2
                                size={18}
                                className="mt-3 animate-spin text-text-secondary"
                              />
                            ) : saved.cards.length === 0 ? (
                              <p className="mt-2 text-sm text-text-secondary">
                                {t("billing.paymentMethod.card.none")}
                              </p>
                            ) : (
                              <ul className="mt-2 divide-y divide-line">
                                {saved.cards.map((card) => (
                                  <li
                                    key={card.id}
                                    className="flex items-center gap-3 py-3"
                                  >
                                    <CardBrandLogo brand={card.brand} />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-text">
                                        {card.brand} ••••{"\u00a0"}
                                      {card.last4}
                                      </p>
                                      {card.expires_at && (
                                        <p className="text-sm text-text-secondary">
                                          {t(
                                            "billing.paymentMethod.card.expires",
                                            {
                                              expiry: formatCardExpiry(
                                                card.expires_at,
                                              ),
                                            },
                                          )}
                                        </p>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      disabled={removingId === card.id}
                                      onClick={() => removeCard(card.id)}
                                      className="shrink-0 text-sm font-medium text-text-secondary hover:underline disabled:opacity-50"
                                    >
                                      {removingId === card.id ? (
                                        <Loader2
                                          size={14}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        t("billing.paymentMethod.card.remove")
                                      )}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {removeFailed && (
                              <p className="mt-2 text-xs text-destructive">
                                {t("billing.paymentMethod.card.removeFailed")}
                              </p>
                            )}
                            {saved.enabled && (
                              <Button
                                size="compact"
                                variant="outline"
                                className="mt-3 h-9 w-full"
                                disabled={saved.linking}
                                onClick={() => void saved.addCard()}
                              >
                                {saved.linking ? (
                                  <>
                                    <Loader2
                                      size={15}
                                      className="animate-spin"
                                    />
                                    {t("billing.paymentMethod.card.adding")}
                                  </>
                                ) : (
                                  <>
                                    <Plus size={15} />
                                    {t("billing.paymentMethod.card.add")}
                                  </>
                                )}
                              </Button>
                            )}
                            {saved.linkFailed && (
                              <p className="mt-2 text-xs text-destructive">
                                {t("billing.paymentMethod.card.addFailed")}
                              </p>
                            )}
                            <p className="mt-3 flex items-start gap-1.5 text-xs text-text-secondary">
                              <Lock
                                size={12}
                                strokeWidth={2}
                                className="mt-0.5 shrink-0"
                              />
                              {t("billing.paymentMethod.card.savedNote")}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-5 flex items-center justify-end gap-3">
                    <Button
                      size="compact"
                      variant="outline"
                      className="h-9 rounded-full"
                      onClick={() => setEditingMethod(false)}
                    >
                      {t("billing.paymentMethod.cancel")}
                    </Button>
                    <Button
                      size="compact"
                      className="h-9 rounded-full"
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
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="text-text">
                      {t("billing.paymentMethod.label")}
                    </p>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      {t("billing.paymentMethod.nextBilling")}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium text-brand">
                    {paymentMethodDisplay}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {!editingMethod && (
            <div className="flex items-center justify-between gap-3 border-t border-line p-4 sm:p-6">
              <p className="text-text">{t("billing.billingHistory.label")}</p>
              <button
                type="button"
                onClick={() => navigate("/billing/history")}
                className="font-medium text-brand hover:underline"
              >
                {t("billing.billingHistory.viewInvoices")}
              </button>
            </div>
          )}
        </section>
      </div>

      <UpgradePlanModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        initialNeed="both"
        onSelectPack={(packId) => {
          setUpgradeModalOpen(false);
          navigate("/billing/payment", { state: { pack: packId } });
        }}
      />
    </div>
  );
}
